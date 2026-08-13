package io.chesstopia.backend.game;

import io.chesstopia.backend.api.model.GameResponse;
import io.chesstopia.backend.api.model.MoveListResponse;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Ebene 3 aus ADR-0019 — echter Port, echte Datenbank.
 *
 * Der Kern dieser Suite ist der zweite Aufruf: Dass ein Zug eine Antwort mit
 * neuer Stellung liefert, beweist nichts über Persistenz. Erst ein eigenes
 * {@code GET} danach zeigt, dass der Zustand die Anfrage überlebt hat.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@ActiveProfiles("test")
@AutoConfigureEmbeddedDatabase
class GameControllerIT {

    private static final String INITIAL_FEN =
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    private static final String AFTER_E2E4 =
            "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";

    @Autowired
    private WebTestClient webTestClient;

    @Test
    void createGame_startetInDerGrundstellung() {
        GameResponse game = createGame();

        assertThat(game.getId()).isNotNull();
        assertThat(game.getFen()).isEqualTo(INITIAL_FEN);
        assertThat(game.getStatus()).isEqualTo(GameResponse.StatusEnum.ONGOING);
        assertThat(game.getMoveCount()).isZero();
    }

    @Test
    void createGame_liefertJedesMalEineEigenePartie() {
        // Sonst teilen sich zwei Spieler unbemerkt einen Zustand.
        assertThat(createGame().getId()).isNotEqualTo(createGame().getId());
    }

    @Test
    void playMove_verschiebtDieStellungUndZaehltDenZug() {
        UUID gameId = createGame().getId();

        GameResponse after = playMove(gameId, "e2e4")
                .expectStatus().isOk()
                .expectBody(GameResponse.class)
                .returnResult().getResponseBody();

        assertThat(after).isNotNull();
        assertThat(after.getFen()).isEqualTo(AFTER_E2E4);
        assertThat(after.getMoveCount()).isEqualTo(1);
    }

    @Test
    void playMove_ueberlebtDieAnfrage() {
        // Die eigentliche Abnahme: Der Zustand liegt in der Datenbank, nicht
        // in der Antwort.
        UUID gameId = createGame().getId();
        playMove(gameId, "e2e4").expectStatus().isOk();

        webTestClient.get().uri("/api/v1/games/{id}", gameId)
                .exchange()
                .expectStatus().isOk()
                .expectBody(GameResponse.class)
                .value(game -> {
                    assertThat(game.getFen()).isEqualTo(AFTER_E2E4);
                    assertThat(game.getMoveCount()).isEqualTo(1);
                });
    }

    @Test
    void listMoves_fuehrtDenEreignisstromLueckenlos() {
        UUID gameId = createGame().getId();
        playMove(gameId, "e2e4").expectStatus().isOk();
        playMove(gameId, "e7e5").expectStatus().isOk();

        webTestClient.get().uri("/api/v1/games/{id}/moves", gameId)
                .exchange()
                .expectStatus().isOk()
                .expectBody(MoveListResponse.class)
                .value(list -> {
                    assertThat(list.getMoves()).hasSize(2);
                    assertThat(list.getMoves().get(0).getMoveNumber()).isEqualTo(1);
                    assertThat(list.getMoves().get(0).getUci()).isEqualTo("e2e4");
                    assertThat(list.getMoves().get(0).getFenAfter()).isEqualTo(AFTER_E2E4);
                    assertThat(list.getMoves().get(1).getMoveNumber()).isEqualTo(2);
                    assertThat(list.getMoves().get(1).getPlayedAt()).isNotNull();
                });
    }

    @Test
    void listMoves_istBeiEinerNeuenPartieLeer() {
        webTestClient.get().uri("/api/v1/games/{id}/moves", createGame().getId())
                .exchange()
                .expectStatus().isOk()
                .expectBody(MoveListResponse.class)
                .value(list -> assertThat(list.getMoves()).isEmpty());
    }

    @Test
    void playMove_lehntDenZugDerFalschenSeiteAb() {
        playMove(createGame().getId(), "e7e5")
                .expectStatus().isBadRequest()
                .expectHeader().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .expectBody()
                .jsonPath("$.detail").value(detail ->
                        assertThat((String) detail).contains("e7e5"));
    }

    @Test
    void playMove_lehntKaputteNotationAb() {
        playMove(createGame().getId(), "quatsch")
                .expectStatus().isBadRequest();
    }

    @Test
    void playMove_zaehltEinenAbgelehntenZugNichtMit() {
        // Ein abgewiesener Zug darf keine Spur im Ereignisstrom hinterlassen.
        UUID gameId = createGame().getId();
        playMove(gameId, "e7e5").expectStatus().isBadRequest();

        webTestClient.get().uri("/api/v1/games/{id}", gameId)
                .exchange()
                .expectBody(GameResponse.class)
                .value(game -> {
                    assertThat(game.getMoveCount()).isZero();
                    assertThat(game.getFen()).isEqualTo(INITIAL_FEN);
                });
    }

    @Test
    void playMove_lehntEinenZugAbDerNichtzurGangartPasst() {
        // Vor CHESS-2 wäre das angenommen worden: Mechanik prüfte nur besetzt/
        // eigene Figur, keine Gangart. Der Läufer zieht hier wie ein Turm.
        playMove(createGame().getId(), "c1c4")
                .expectStatus().isBadRequest()
                .expectHeader().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
    }

    @Test
    void playMove_setztDenStatusBeiMattAufCompleted() {
        UUID gameId = createGame().getId();
        playMove(gameId, "f2f3").expectStatus().isOk();
        playMove(gameId, "e7e5").expectStatus().isOk();
        playMove(gameId, "g2g4").expectStatus().isOk();

        GameResponse mate = playMove(gameId, "d8h4")
                .expectStatus().isOk()
                .expectBody(GameResponse.class)
                .returnResult().getResponseBody();

        assertThat(mate).isNotNull();
        assertThat(mate.getStatus()).isEqualTo(GameResponse.StatusEnum.COMPLETED);

        webTestClient.get().uri("/api/v1/games/{id}", gameId)
                .exchange()
                .expectStatus().isOk()
                .expectBody(GameResponse.class)
                .value(game -> assertThat(game.getStatus()).isEqualTo(GameResponse.StatusEnum.COMPLETED));
    }

    @Test
    void playMove_lehntEinenZugAufEinerBeendetenPartieAb() {
        UUID gameId = createGame().getId();
        playMove(gameId, "f2f3").expectStatus().isOk();
        playMove(gameId, "e7e5").expectStatus().isOk();
        playMove(gameId, "g2g4").expectStatus().isOk();
        playMove(gameId, "d8h4").expectStatus().isOk();

        playMove(gameId, "e1f2")
                .expectStatus().isBadRequest()
                .expectHeader().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
    }

    @Test
    void unbekanntePartie_liefert404() {
        webTestClient.get().uri("/api/v1/games/{id}", UUID.randomUUID())
                .exchange()
                .expectStatus().isNotFound()
                .expectHeader().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);

        playMove(UUID.randomUUID(), "e2e4").expectStatus().isNotFound();
    }

    @Test
    void keineUuid_liefert400UndKein500() {
        // Ohne eigenen Handler fiele das ins Auffangbecken und meldete einen
        // Serverfehler für einen Tippfehler des Clients.
        webTestClient.get().uri("/api/v1/games/keine-uuid")
                .exchange()
                .expectStatus().isBadRequest();
    }

    private GameResponse createGame() {
        GameResponse game = webTestClient.post().uri("/api/v1/games")
                .exchange()
                .expectStatus().isCreated()
                .expectBody(GameResponse.class)
                .returnResult().getResponseBody();
        assertThat(game).isNotNull();
        return game;
    }

    private WebTestClient.ResponseSpec playMove(UUID gameId, String uci) {
        return webTestClient.post().uri("/api/v1/games/{id}/moves", gameId)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("uci", uci))
                .exchange();
    }
}

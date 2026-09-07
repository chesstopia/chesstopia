package io.chesstopia.backend.game.adapter.in.web;

import io.chesstopia.backend.api.model.GameResponse;
import io.chesstopia.backend.api.model.MoveListResponse;
import io.chesstopia.backend.api.model.Piece;
import io.chesstopia.backend.api.model.Position;
import io.chesstopia.backend.api.model.Square;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Slice-3-IT des {@code game}-Web-Adapters gegen die strukturierte API
 * ({@code docs/api/openapi.yaml}). Prüft den vollen Stapel — Controller,
 * Anwendung, Engine-Adapter, JSONB-Persistenz — über echtes HTTP mit
 * eingebetteter Postgres.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@ActiveProfiles("test")
@AutoConfigureEmbeddedDatabase
class GameControllerIT {

    @Autowired
    private WebTestClient webTestClient;

    // ---- Helfer ----

    private static Map<String, Object> square(String file, String rank) {
        return Map.of("file", file, "rank", rank);
    }

    private static Map<String, Object> move(String fromFile, String fromRank, String toFile, String toRank) {
        return Map.of("from", square(fromFile, fromRank), "to", square(toFile, toRank));
    }

    private GameResponse createGame() {
        return webTestClient.post()
            .uri("/api/v1/games")
            .exchange()
            .expectStatus().isCreated()
            .expectBody(GameResponse.class)
            .returnResult().getResponseBody();
    }

    private GameResponse getGame(UUID id) {
        return webTestClient.get()
            .uri("/api/v1/games/{id}", id)
            .exchange()
            .expectStatus().isOk()
            .expectBody(GameResponse.class)
            .returnResult().getResponseBody();
    }

    private void playMove(UUID id, Map<String, Object> body) {
        webTestClient.post()
            .uri("/api/v1/games/{id}/moves", id)
            .bodyValue(body)
            .exchange()
            .expectStatus().isOk();
    }

    private GameResponse playMoveAndGet(UUID id, Map<String, Object> body) {
        return webTestClient.post()
            .uri("/api/v1/games/{id}/moves", id)
            .bodyValue(body)
            .exchange()
            .expectStatus().isOk()
            .expectBody(GameResponse.class)
            .returnResult().getResponseBody();
    }

    private static boolean hasPiece(Position position, Square.FileEnum file, Square.RankEnum rank,
                                    Piece.TypeEnum type, Piece.ColorEnum color) {
        return position.getBoard().stream().anyMatch(pp ->
            pp.getSquare().getFile() == file
                && pp.getSquare().getRank() == rank
                && pp.getPiece().getType() == type
                && pp.getPiece().getColor() == color);
    }

    // ---- Szenarien ----

    @Test
    void createGame_liefertStartstellung() {
        // ACT
        GameResponse response = createGame();

        // ASSERTIONS
        assertThat(response.getId()).isNotNull();
        assertThat(response.getStatus()).isEqualTo(GameResponse.StatusEnum.ONGOING);
        assertThat(response.getMoveCount()).isZero();
        assertThat(response.getPosition().getSideToMove()).isEqualTo(Position.SideToMoveEnum.WHITE);
        assertThat(response.getPosition().getBoard()).hasSize(32);
    }

    @Test
    void createGame_zweiPartienHabenVerschiedeneIds() {
        // ACT & ASSERTIONS
        assertThat(createGame().getId()).isNotEqualTo(createGame().getId());
    }

    @Test
    void playMove_e2e4_wirdAusgefuehrtUndPersistiert() {
        // ARRANGE
        UUID id = createGame().getId();

        // ACT
        GameResponse afterMove = webTestClient.post()
            .uri("/api/v1/games/{id}/moves", id)
            .bodyValue(move("E", "TWO", "E", "FOUR"))
            .exchange()
            .expectStatus().isOk()
            .expectBody(GameResponse.class)
            .returnResult().getResponseBody();

        // ASSERTIONS
        assertThat(afterMove.getMoveCount()).isEqualTo(1);
        assertThat(hasPiece(afterMove.getPosition(),
            Square.FileEnum.E, Square.RankEnum.FOUR, Piece.TypeEnum.PAWN, Piece.ColorEnum.WHITE)).isTrue();

        // Eigenes GET — die Stellung muss den Request überlebt haben.
        GameResponse reloaded = getGame(id);
        assertThat(reloaded.getMoveCount()).isEqualTo(1);
        assertThat(reloaded.getPosition().getSideToMove()).isEqualTo(Position.SideToMoveEnum.BLACK);
        assertThat(hasPiece(reloaded.getPosition(),
            Square.FileEnum.E, Square.RankEnum.FOUR, Piece.TypeEnum.PAWN, Piece.ColorEnum.WHITE)).isTrue();
    }

    @Test
    void listMoves_nachZweiZuegen_liefertBeideEintraege() {
        // ARRANGE
        UUID id = createGame().getId();
        playMove(id, move("E", "TWO", "E", "FOUR"));
        playMove(id, move("E", "SEVEN", "E", "FIVE"));

        // ACT
        MoveListResponse list = webTestClient.get()
            .uri("/api/v1/games/{id}/moves", id)
            .exchange()
            .expectStatus().isOk()
            .expectBody(MoveListResponse.class)
            .returnResult().getResponseBody();

        // ASSERTIONS
        assertThat(list.getMoves()).hasSize(2);
        assertThat(list.getMoves().get(0).getMoveNumber()).isEqualTo(1);
        assertThat(list.getMoves().get(1).getMoveNumber()).isEqualTo(2);
        assertThat(list.getMoves().get(0).getMove().getFrom())
            .isEqualTo(new Square(Square.FileEnum.E, Square.RankEnum.TWO));
        assertThat(list.getMoves().get(0).getMove().getTo())
            .isEqualTo(new Square(Square.FileEnum.E, Square.RankEnum.FOUR));
        assertThat(list.getMoves().get(0).getPlayedAt()).isNotNull();
    }

    @Test
    void listMoves_neuePartie_istLeer() {
        // ARRANGE
        UUID id = createGame().getId();

        // ACT & ASSERTIONS
        webTestClient.get()
            .uri("/api/v1/games/{id}/moves", id)
            .exchange()
            .expectStatus().isOk()
            .expectBody(MoveListResponse.class)
            .value(list -> assertThat(list.getMoves()).isEmpty());
    }

    @Test
    void playMove_falscheSeiteZuerst_wird400MitProblemJson() {
        // ARRANGE
        UUID id = createGame().getId();

        // ACT & ASSERTIONS
        webTestClient.post()
            .uri("/api/v1/games/{id}/moves", id)
            .bodyValue(move("E", "SEVEN", "E", "FIVE"))
            .exchange()
            .expectStatus().isBadRequest()
            .expectHeader().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
            .expectBody()
            .jsonPath("$.detail").value(detail -> assertThat((String) detail).contains("e7"));
    }

    @Test
    void unbekanntePartie_wird404() {
        // ACT & ASSERTIONS
        webTestClient.post()
            .uri("/api/v1/games/{id}/moves", UUID.randomUUID())
            .bodyValue(move("E", "TWO", "E", "FOUR"))
            .exchange()
            .expectStatus().isNotFound();

        webTestClient.get()
            .uri("/api/v1/games/{id}", UUID.randomUUID())
            .exchange()
            .expectStatus().isNotFound();
    }

    @Test
    void getGame_keineUuid_wird400() {
        // ACT & ASSERTIONS
        webTestClient.get()
            .uri("/api/v1/games/keine-uuid")
            .exchange()
            .expectStatus().isBadRequest();
    }

    @Test
    void abgelehnterZug_hinterlaesstKeinenPly() {
        // ARRANGE
        UUID id = createGame().getId();

        // ACT & ASSERTIONS
        webTestClient.post()
            .uri("/api/v1/games/{id}/moves", id)
            .bodyValue(move("E", "SEVEN", "E", "FIVE"))
            .exchange()
            .expectStatus().isBadRequest();

        assertThat(getGame(id).getMoveCount()).isZero();
    }

    @Test
    void playMove_laeuferVerstellt_wird400UndStellungBleibtUnveraendert() {
        // ARRANGE
        UUID id = createGame().getId();

        // ACT & ASSERTIONS
        // Läufer f1 kann in der Grundstellung nicht ziehen (durch eigenen Bauern auf e2 verstellt)
        webTestClient.post()
            .uri("/api/v1/games/{id}/moves", id)
            .bodyValue(move("F", "ONE", "B", "FIVE"))
            .exchange()
            .expectStatus().isBadRequest();

        GameResponse unchanged = getGame(id);
        assertThat(unchanged.getStatus()).isEqualTo(GameResponse.StatusEnum.ONGOING);
        assertThat(unchanged.getMoveCount()).isZero();
    }

    @Test
    void narrenmatt_beendetDiePartieMitBlackWonUndCheckmate() {
        // ARRANGE
        UUID id = createGame().getId();
        // 1. f2-f3  e7-e5  2. g2-g4  Qd8-h4#
        playMove(id, move("F", "TWO", "F", "THREE"));
        playMove(id, move("E", "SEVEN", "E", "FIVE"));
        playMove(id, move("G", "TWO", "G", "FOUR"));

        // ACT
        GameResponse afterMate = playMoveAndGet(id, move("D", "EIGHT", "H", "FOUR"));

        // ASSERTIONS
        assertThat(afterMate.getStatus()).isEqualTo(GameResponse.StatusEnum.BLACK_WON);
        assertThat(afterMate.getEndReason()).isEqualTo(GameResponse.EndReasonEnum.CHECKMATE);
    }
}

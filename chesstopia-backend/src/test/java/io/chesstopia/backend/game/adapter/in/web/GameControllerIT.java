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
        GameResponse response = createGame();

        assertThat(response.getId()).isNotNull();
        assertThat(response.getStatus()).isEqualTo(GameResponse.StatusEnum.ONGOING);
        assertThat(response.getMoveCount()).isZero();
        assertThat(response.getPosition().getSideToMove()).isEqualTo(Position.SideToMoveEnum.WHITE);
        assertThat(response.getPosition().getBoard()).hasSize(32);
    }

    @Test
    void createGame_zweiPartienHabenVerschiedeneIds() {
        assertThat(createGame().getId()).isNotEqualTo(createGame().getId());
    }

    @Test
    void playMove_e2e4_wirdAusgefuehrtUndPersistiert() {
        UUID id = createGame().getId();

        GameResponse afterMove = webTestClient.post()
            .uri("/api/v1/games/{id}/moves", id)
            .bodyValue(move("E", "TWO", "E", "FOUR"))
            .exchange()
            .expectStatus().isOk()
            .expectBody(GameResponse.class)
            .returnResult().getResponseBody();

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
        UUID id = createGame().getId();
        playMove(id, move("E", "TWO", "E", "FOUR"));
        playMove(id, move("E", "SEVEN", "E", "FIVE"));

        MoveListResponse list = webTestClient.get()
            .uri("/api/v1/games/{id}/moves", id)
            .exchange()
            .expectStatus().isOk()
            .expectBody(MoveListResponse.class)
            .returnResult().getResponseBody();

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
        UUID id = createGame().getId();

        webTestClient.get()
            .uri("/api/v1/games/{id}/moves", id)
            .exchange()
            .expectStatus().isOk()
            .expectBody(MoveListResponse.class)
            .value(list -> assertThat(list.getMoves()).isEmpty());
    }

    @Test
    void playMove_falscheSeiteZuerst_wird400MitProblemJson() {
        UUID id = createGame().getId();

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
        webTestClient.get()
            .uri("/api/v1/games/keine-uuid")
            .exchange()
            .expectStatus().isBadRequest();
    }

    @Test
    void abgelehnterZug_hinterlaesstKeinenPly() {
        UUID id = createGame().getId();

        webTestClient.post()
            .uri("/api/v1/games/{id}/moves", id)
            .bodyValue(move("E", "SEVEN", "E", "FIVE"))
            .exchange()
            .expectStatus().isBadRequest();

        assertThat(getGame(id).getMoveCount()).isZero();
    }

    private void playMove(UUID id, Map<String, Object> body) {
        webTestClient.post()
            .uri("/api/v1/games/{id}/moves", id)
            .bodyValue(body)
            .exchange()
            .expectStatus().isOk();
    }
}

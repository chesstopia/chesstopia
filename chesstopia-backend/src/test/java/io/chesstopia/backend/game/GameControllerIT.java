package io.chesstopia.backend.game;

import io.chesstopia.backend.api.model.BoardStateResponse;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@ActiveProfiles("test")
@AutoConfigureEmbeddedDatabase
class GameControllerIT {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    void get_returnsInitialPositionAsFen() {
        webTestClient.get()
            .uri("/api/v1/game/board")
            .exchange()
            .expectStatus().isOk()
            .expectBody(BoardStateResponse.class)
            .value(response -> assertThat(response.getFen())
                .isEqualTo("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"));
    }

    @Test
    void get_isSafeAndRepeatable() {
        // Der Endpunkt liest nur. Zwei Aufrufe müssen dieselbe Stellung liefern —
        // sonst hat sich Zustand in den Lesepfad geschlichen.
        String first = fetchFen();

        assertThat(fetchFen()).isEqualTo(first);
    }

    private String fetchFen() {
        return webTestClient.get()
            .uri("/api/v1/game/board")
            .exchange()
            .expectStatus().isOk()
            .expectBody(BoardStateResponse.class)
            .returnResult()
            .getResponseBody()
            .getFen();
    }
}

package io.chesstopia.backend.counter;

import io.chesstopia.backend.api.model.CounterResponse;
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
class CounterControllerIT {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    void post_incrementsCounterByOne() {
        // ACT & ASSERTIONS
        webTestClient.post()
            .uri("/api/v1/counter")
            .exchange()
            .expectStatus().isOk()
            .expectBody(CounterResponse.class)
            .value(response -> assertThat(response.getValue()).isEqualTo(1));

        webTestClient.post()
            .uri("/api/v1/counter")
            .exchange()
            .expectStatus().isOk()
            .expectBody(CounterResponse.class)
            .value(response -> assertThat(response.getValue()).isEqualTo(2));
    }
}

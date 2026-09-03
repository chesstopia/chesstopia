package io.chesstopia.backend.hello;

import io.chesstopia.backend.api.model.HelloResponse;
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
class HelloControllerIT {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    void get_returnsGreeting() {
        // ACT & ASSERTIONS
        webTestClient.get()
            .uri("/api/v1/hello")
            .exchange()
            .expectStatus().isOk()
            .expectBody(HelloResponse.class)
            .value(response -> assertThat(response.getMessage()).isNotBlank());
    }

    @Test
    void get_isReachableWithoutAuthentication() {
        // Spring Security liegt von Tag 1 im Classpath und ist bewusst permissiv
        // konfiguriert (ADR-0015). Dieser Test hält fest, dass das so ist: Wer die
        // Kette scharf schaltet, sieht hier ein 401 statt eines stillen Verhaltens-
        // wechsels an der Aussenkante.

        // ACT & ASSERTIONS
        webTestClient.get()
            .uri("/api/v1/hello")
            .exchange()
            .expectStatus().isOk();
    }
}

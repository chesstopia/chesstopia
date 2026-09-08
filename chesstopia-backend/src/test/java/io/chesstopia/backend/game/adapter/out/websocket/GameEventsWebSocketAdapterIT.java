package io.chesstopia.backend.game.adapter.out.websocket;

import io.chesstopia.backend.api.model.GameCreatedResponse;
import io.chesstopia.backend.api.model.GameResponse;
import io.chesstopia.backend.api.model.Position;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import java.lang.reflect.Type;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.messaging.converter.JacksonJsonMessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Belegt live, dass ein gespielter Zug über den STOMP-Broker ankommt —
 * das Verhalten von {@code @TransactionalEventListener(AFTER_COMMIT)} zeigt sich
 * nur mit einer echten, committenden Transaktion und ist deshalb auf Unit-Test-Ebene
 * nicht prüfbar (ADR-0019: dafür ist diese Ebene der richtige Ort).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@ActiveProfiles("test")
@AutoConfigureEmbeddedDatabase
class GameEventsWebSocketAdapterIT {

    @Autowired
    private WebTestClient webTestClient;

    @LocalServerPort
    private int port;

    @Test
    void einGespielterZugWirdÜberDenBrokerBroadcastet() throws Exception {
        // ARRANGE
        GameCreatedResponse created = webTestClient.post()
            .uri("/api/v1/games")
            .exchange()
            .expectStatus().isCreated()
            .expectBody(GameCreatedResponse.class)
            .returnResult().getResponseBody();

        WebSocketStompClient stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(new JacksonJsonMessageConverter());
        CompletableFuture<GameResponse> received = new CompletableFuture<>();

        StompSession session = stompClient
            .connectAsync("ws://localhost:" + port + "/ws", new StompSessionHandlerAdapter() {})
            .get(5, TimeUnit.SECONDS);
        session.subscribe("/topic/games/" + created.getId(), new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return GameResponse.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                received.complete((GameResponse) payload);
            }
        });
        // Kein STOMP-Receipt verdrahtet — kurze Wartezeit, damit das SUBSCRIBE-Frame
        // beim Broker ankommt, bevor der Zug den Broadcast auslöst.
        Thread.sleep(300);

        // ACT
        webTestClient.post()
            .uri("/api/v1/games/{id}/moves", created.getId())
            .header("X-Player-Token", created.getOwnerToken().toString())
            .bodyValue(Map.of(
                "from", Map.of("file", "E", "rank", "TWO"),
                "to", Map.of("file", "E", "rank", "FOUR")))
            .exchange()
            .expectStatus().isOk();

        // ASSERTIONS
        GameResponse broadcast = received.get(5, TimeUnit.SECONDS);
        assertThat(broadcast.getId()).isEqualTo(created.getId());
        assertThat(broadcast.getMoveCount()).isEqualTo(1);
        assertThat(broadcast.getPosition().getSideToMove()).isEqualTo(Position.SideToMoveEnum.BLACK);

        session.disconnect();
        stompClient.stop();
    }
}

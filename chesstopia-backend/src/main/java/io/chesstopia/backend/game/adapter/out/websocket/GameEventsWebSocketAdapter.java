package io.chesstopia.backend.game.adapter.out.websocket;

import io.chesstopia.backend.game.adapter.in.web.WebMapper;
import io.chesstopia.backend.game.application.port.out.GameEvents;
import io.chesstopia.backend.game.domain.Game;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Publiziert einen gespielten Zug an {@code /topic/games/{gameId}} über den
 * bestehenden STOMP-Broker ({@link io.chesstopia.backend.config.WebSocketConfig}).
 * Wiederverwendet {@link WebMapper} statt einen fünften Adapter-Mapper
 * einzuführen (CLAUDE.md Verbot 5 zählt exakt vier).
 */
@Component
class GameEventsWebSocketAdapter implements GameEvents {

    private final SimpMessagingTemplate messagingTemplate;
    private final WebMapper mapper;

    GameEventsWebSocketAdapter(SimpMessagingTemplate messagingTemplate, WebMapper mapper) {
        this.messagingTemplate = messagingTemplate;
        this.mapper = mapper;
    }

    @Override
    public void moveWasPlayed(Game game) {
        messagingTemplate.convertAndSend(
            "/topic/games/" + game.id().value(),
            mapper.toResponse(game, game.history().size()));
    }
}

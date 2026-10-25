package io.chesstopia.backend.game.adapter.out.websocket;

import io.chesstopia.backend.game.adapter.in.web.WebMapper;
import io.chesstopia.backend.game.application.port.out.GameEvents;
import io.chesstopia.backend.game.domain.Game;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Publiziert einen gespielten Zug an {@code /topic/games/{gameId}} über den
 * bestehenden STOMP-Broker ({@link io.chesstopia.backend.config.WebSocketConfig}) —
 * aber erst, nachdem die Transaktion committet ist: sonst könnte ein Abonnent auf
 * einen Zug reagieren, der bei einem Rollback nie stattgefunden hat, oder der
 * moveCount-Guard auf dem Client würde nach einem fehlgeschlagenen Commit die
 * danach folgende korrekte (niedrigere) Stellung verwerfen.
 *
 * {@link #moveWasPlayed} veröffentlicht dafür nur ein internes Spring-Event;
 * {@link #onMoveWasPlayed} sendet erst danach, über
 * {@code @TransactionalEventListener(AFTER_COMMIT)}. {@code fallbackExecution = true}
 * sorgt dafür, dass trotzdem gesendet wird, wenn {@link #moveWasPlayed} ohne aktive
 * Transaktion aufgerufen wird (z. B. ruft {@code GameServiceTest} {@code play(...)}
 * direkt gegen Mockito-Kollaborateure auf, ganz ohne Transaktion) — sonst würde
 * Spring das Event dort kommentarlos verwerfen.
 *
 * Die einzige Implementierung von {@link GameEvents}: der Anwendungsservice kennt
 * nur den Port, keine Transaktionsgrenzen. Wiederverwendet {@link WebMapper} statt
 * einen fünften Adapter-Mapper einzuführen (CLAUDE.md Verbot 5 zählt exakt vier).
 */
@Component
class GameEventsWebSocketAdapter implements GameEvents {

    private final ApplicationEventPublisher events;
    private final SimpMessagingTemplate messagingTemplate;
    private final WebMapper mapper;

    GameEventsWebSocketAdapter(ApplicationEventPublisher events, SimpMessagingTemplate messagingTemplate,
                                WebMapper mapper) {
        this.events = events;
        this.messagingTemplate = messagingTemplate;
        this.mapper = mapper;
    }

    @Override
    public void moveWasPlayed(Game game) {
        events.publishEvent(new MoveWasPlayed(game));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    void onMoveWasPlayed(MoveWasPlayed event) {
        Game game = event.game();
        messagingTemplate.convertAndSend(
            "/topic/games/" + game.id().value(),
            mapper.toResponse(game, game.history().size()));
    }

    /** Internes Transportmittel zwischen {@link #moveWasPlayed} und {@link #onMoveWasPlayed}. */
    private record MoveWasPlayed(Game game) {}
}

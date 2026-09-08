package io.chesstopia.backend.game.adapter.out.transaction;

import io.chesstopia.backend.game.application.port.out.GameEvents;
import io.chesstopia.backend.game.domain.Game;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Verzögert die Veröffentlichung eines {@link GameEvents}-Events, bis die laufende
 * Transaktion committet ist — läuft gerade keine Transaktion, wird sofort
 * veröffentlicht. Verhindert zwei Fehlerfälle: dass ein Abonnent auf einen Zug
 * reagiert, der bei einem anschließenden Rollback nie stattgefunden hat, und dass
 * ein Rollback nach der Veröffentlichung Clients über einen Zug informiert, den es
 * nie gab — der moveCount-Guard auf dem Client würde die danach folgende korrekte
 * (niedrigere) Stellung sonst verwerfen.
 *
 * Umhüllt den eigentlichen Transport ({@link io.chesstopia.backend.game.adapter.out.websocket.GameEventsWebSocketAdapter})
 * und ist bewusst {@link Primary}: {@code GameService} — und jeder künftige
 * Aufrufer — soll den transaktionssicheren Weg automatisch bekommen, ohne
 * Transaktionsgrenzen selbst zu kennen.
 */
@Component
@Primary
class TransactionalGameEvents implements GameEvents {

    private final GameEvents delegate;

    TransactionalGameEvents(GameEvents delegate) {
        this.delegate = delegate;
    }

    @Override
    public void moveWasPlayed(Game game) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            delegate.moveWasPlayed(game);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                delegate.moveWasPlayed(game);
            }
        });
    }
}

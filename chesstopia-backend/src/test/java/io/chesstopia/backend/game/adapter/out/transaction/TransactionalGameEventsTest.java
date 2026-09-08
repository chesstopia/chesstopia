package io.chesstopia.backend.game.adapter.out.transaction;

import io.chesstopia.backend.game.application.port.out.GameEvents;
import io.chesstopia.backend.game.domain.CastlingRights;
import io.chesstopia.backend.game.domain.Color;
import io.chesstopia.backend.game.domain.Game;
import io.chesstopia.backend.game.domain.GameId;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.RuleSet;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.OffsetDateTime;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class TransactionalGameEventsTest {

    @Mock private GameEvents delegate;
    @InjectMocks private TransactionalGameEvents events;

    private final Game game = Game.start(GameId.newId(), RuleSet.standard(),
        new Position(Map.of(), Color.WHITE, CastlingRights.all(), null, 0, 1),
        OffsetDateTime.parse("2026-09-02T10:00:00Z"));

    @AfterEach
    void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void ohneAktiveTransaktionVeroeffentlichtSofort() {
        // ACT
        events.moveWasPlayed(game);

        // ASSERTIONS
        verify(delegate).moveWasPlayed(game);
    }

    @Test
    void mitAktiverTransaktionVeroeffentlichtErstNachCommit() {
        // ARRANGE
        TransactionSynchronizationManager.initSynchronization();

        // ACT
        events.moveWasPlayed(game);

        // ASSERTIONS — vor dem simulierten Commit ist noch nichts veröffentlicht
        verify(delegate, never()).moveWasPlayed(any());

        // ACT — Commit simulieren
        TransactionSynchronizationManager.getSynchronizations()
            .forEach(TransactionSynchronization::afterCommit);

        // ASSERTIONS
        verify(delegate).moveWasPlayed(game);
    }
}

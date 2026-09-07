package io.chesstopia.backend.game.adapter.out.persistence;

import io.chesstopia.backend.game.domain.*;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.OffsetDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureEmbeddedDatabase
class GamePersistenceAdapterIT {

    @Autowired GamePersistenceAdapter adapter;

    private static final OffsetDateTime T0 = OffsetDateTime.parse("2026-09-02T10:00:00Z");
    private final Position start = new Position(
        Map.of(new Square(File.E, Rank.ONE), new Piece(PieceType.KING, Color.WHITE)),
        Color.WHITE, CastlingRights.all(), null, 0, 1);
    private final Position afterMove = new Position(
        Map.of(new Square(File.E, Rank.TWO), new Piece(PieceType.KING, Color.WHITE)),
        Color.BLACK, CastlingRights.all(), null, 1, 1);
    private final Move move = new Move(new Square(File.E, Rank.ONE), new Square(File.E, Rank.TWO), null);
    private final GameConclusion inProgress = new GameConclusion(GameStatus.ONGOING, null);

    @Test
    void eineNeuePartieUeberlebtDenRoundtrip() {
        // ARRANGE
        Game g = Game.start(GameId.newId(), RuleSet.standard(), start, T0);
        adapter.save(g);

        // ACT
        var loaded = adapter.findById(g.id());

        // ASSERTIONS
        assertThat(loaded).get().satisfies(l -> {
            assertThat(l.currentPosition()).isEqualTo(start);
            assertThat(l.ruleSet()).isEqualTo(RuleSet.standard());
            assertThat(l.status()).isEqualTo(GameStatus.ONGOING);
            assertThat(l.endReason()).isNull();
            assertThat(l.history()).isEmpty();
        });
    }

    @Test
    void einAngehaengterZugWirdAlsEreignisGespeichert() {
        // ARRANGE
        Game g = Game.start(GameId.newId(), RuleSet.standard(), start, T0);
        adapter.save(g);

        // ACT
        adapter.save(adapter.findById(g.id()).orElseThrow().play(move, afterMove, inProgress, T0.plusMinutes(1)));

        // ASSERTIONS
        assertThat(adapter.findById(g.id())).get().satisfies(loaded -> {
            assertThat(loaded.currentPosition()).isEqualTo(afterMove);
            assertThat(loaded.history()).singleElement().satisfies(p -> {
                assertThat(p.number()).isEqualTo(1);
                assertThat(p.move()).isEqualTo(move);
                assertThat(p.positionAfter()).isEqualTo(afterMove);
            });
        });
    }

    @Test
    void eineBeendetePartieUeberlebtDenRoundtripMitEndgrund() {
        // ARRANGE
        Game g = Game.start(GameId.newId(), RuleSet.standard(), start, T0);
        adapter.save(g);
        GameConclusion checkmate = new GameConclusion(GameStatus.WHITE_WON, EndReason.CHECKMATE);

        // ACT
        adapter.save(adapter.findById(g.id()).orElseThrow().play(move, afterMove, checkmate, T0.plusMinutes(1)));

        // ASSERTIONS
        assertThat(adapter.findById(g.id())).get().satisfies(loaded -> {
            assertThat(loaded.status()).isEqualTo(GameStatus.WHITE_WON);
            assertThat(loaded.endReason()).isEqualTo(EndReason.CHECKMATE);
        });
    }

    @Test
    void unbekanntePartieIstLeer() {
        // ACT & ASSERTIONS
        assertThat(adapter.findById(GameId.newId())).isEmpty();
    }
}

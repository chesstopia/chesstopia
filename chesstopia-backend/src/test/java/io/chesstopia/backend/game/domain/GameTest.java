package io.chesstopia.backend.game.domain;

import org.junit.jupiter.api.Test;
import java.time.OffsetDateTime;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class GameTest {

    private static final OffsetDateTime T0 = OffsetDateTime.parse("2026-09-02T10:00:00Z");
    private final Position start = new Position(Map.of(), Color.WHITE, CastlingRights.all(), null, 0, 1);
    private final Position afterOne = new Position(Map.of(), Color.BLACK, CastlingRights.all(), null, 0, 1);
    private final Move move = new Move(new Square(File.E, Rank.TWO), new Square(File.E, Rank.FOUR), null);
    private final GameConclusion inProgress = new GameConclusion(GameStatus.ONGOING, null);

    @Test
    void startBeginntOhneHistorieLaufendInDerGrundstellung() {
        // ACT
        Game g = Game.start(GameId.newId(), RuleSet.standard(), start, T0);

        // ASSERTIONS
        assertThat(g.history()).isEmpty();
        assertThat(g.status()).isEqualTo(GameStatus.ONGOING);
        assertThat(g.endReason()).isNull();
        assertThat(g.currentPosition()).isEqualTo(start);
        assertThat(g.createdAt()).isEqualTo(T0);
    }

    @Test
    void playHaengtEinenLueckenlosNummeriertenPlyAn() {
        // ACT
        Game g = Game.start(GameId.newId(), RuleSet.standard(), start, T0)
                     .play(move, afterOne, inProgress, T0.plusMinutes(1));

        // ASSERTIONS
        assertThat(g.history()).singleElement().satisfies(p -> {
            assertThat(p.number()).isEqualTo(1);
            assertThat(p.move()).isEqualTo(move);
            assertThat(p.positionAfter()).isEqualTo(afterOne);
        });
        assertThat(g.currentPosition()).isEqualTo(afterOne);
        assertThat(g.updatedAt()).isEqualTo(T0.plusMinutes(1));
    }

    @Test
    void aufeinanderfolgendePlysZaehlenHoch() {
        // ACT
        Game g = Game.start(GameId.newId(), RuleSet.standard(), start, T0)
                     .play(move, afterOne, inProgress, T0).play(move, start, inProgress, T0);

        // ASSERTIONS
        assertThat(g.history()).extracting(Ply::number).containsExactly(1, 2);
    }

    @Test
    void dieHistorieIstNachAussenUnveraenderlich() {
        // ARRANGE
        Game g = Game.start(GameId.newId(), RuleSet.standard(), start, T0).play(move, afterOne, inProgress, T0);

        // ACT & ASSERTIONS
        assertThatThrownBy(() -> g.history().clear()).isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void playUebernimmtStatusUndEndgrundAusDerConclusion() {
        // ARRANGE
        GameConclusion blackWon = new GameConclusion(GameStatus.BLACK_WON, EndReason.CHECKMATE);

        // ACT
        Game g = Game.start(GameId.newId(), RuleSet.standard(), start, T0)
                     .play(move, afterOne, blackWon, T0.plusMinutes(1));

        // ASSERTIONS
        assertThat(g.status()).isEqualTo(GameStatus.BLACK_WON);
        assertThat(g.endReason()).isEqualTo(EndReason.CHECKMATE);
    }

    @Test
    void playAufEinerBeendetenPartieWirft() {
        // ARRANGE
        Game done = new Game(GameId.newId(), RuleSet.standard(), start, java.util.List.of(),
                             GameStatus.DRAW, EndReason.STALEMATE, T0, T0);

        // ACT & ASSERTIONS
        assertThatThrownBy(() -> done.play(move, afterOne, inProgress, T0)).isInstanceOf(IllegalStateException.class);
    }
}

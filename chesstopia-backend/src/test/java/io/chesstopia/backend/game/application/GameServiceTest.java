package io.chesstopia.backend.game.application;

import io.chesstopia.backend.error.NotFoundException;
import io.chesstopia.backend.game.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class GameServiceTest {

    private FakeGames games;
    private FakeChessRules rules;
    private GameService service;

    private final Position start = new Position(Map.of(), Color.WHITE, CastlingRights.all(), null, 0, 1);
    private final Position afterMove = new Position(Map.of(), Color.BLACK, CastlingRights.all(), null, 0, 1);
    private final Move e2e4 = new Move(new Square(File.E, Rank.TWO), new Square(File.E, Rank.FOUR), null);

    @BeforeEach
    void setUp() {
        games = new FakeGames();
        rules = new FakeChessRules(start, afterMove);
        service = new GameService(games, rules);
    }

    @Test
    void startLegtEineLaufendePartieInDerAnfangsstellungAn() {
        GameId id = service.start(RuleSet.standard());
        assertThat(games.findById(id)).get().satisfies(g -> {
            assertThat(g.currentPosition()).isEqualTo(start);
            assertThat(g.status()).isEqualTo(GameStatus.ONGOING);
            assertThat(g.history()).isEmpty();
        });
    }

    @Test
    void playPrueftMitDerEngineHaengtDenZugAnUndSpeichert() {
        GameId id = service.start(RuleSet.standard());
        Position result = service.play(id, e2e4);
        assertThat(result).isEqualTo(afterMove);
        assertThat(games.findById(id)).get().satisfies(g ->
            assertThat(g.history()).singleElement()
                .satisfies(p -> assertThat(p.move()).isEqualTo(e2e4)));
    }

    @Test
    void playLehntEinenNichtAusfuehrbarenZugAbUndSchreibtNichts() {
        GameId id = service.start(RuleSet.standard());
        rules.rejectEverything();
        assertThatThrownBy(() -> service.play(id, e2e4)).isInstanceOf(IllegalArgumentException.class);
        assertThat(games.findById(id)).get().satisfies(g -> assertThat(g.history()).isEmpty());
    }

    @Test
    void playAufUnbekannterPartieWirftNotFound() {
        assertThatThrownBy(() -> service.play(GameId.newId(), e2e4)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void loadAufUnbekannterPartieWirftNotFound() {
        assertThatThrownBy(() -> service.load(GameId.newId())).isInstanceOf(NotFoundException.class);
    }
}

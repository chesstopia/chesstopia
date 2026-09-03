package io.chesstopia.backend.game.application;

import io.chesstopia.backend.error.NotFoundException;
import io.chesstopia.backend.game.application.port.out.ChessEngine;
import io.chesstopia.backend.game.application.port.out.GamesRepository;
import io.chesstopia.backend.game.domain.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock private GamesRepository gamesRepository;
    @Mock private ChessEngine chessEngine;
    @InjectMocks private GameService service;

    private static final GameId ID = GameId.newId();
    private static final OffsetDateTime T0 = OffsetDateTime.parse("2026-09-02T10:00:00Z");

    private final Position start = new Position(Map.of(), Color.WHITE, CastlingRights.all(), null, 0, 1);
    private final Position afterMove = new Position(Map.of(), Color.BLACK, CastlingRights.all(), null, 0, 1);
    private final Move e2e4 = new Move(new Square(File.E, Rank.TWO), new Square(File.E, Rank.FOUR), null);

    @Test
    void startLegtEineLaufendePartieInDerAnfangsstellungAn() {
        // ARRANGE
        when(chessEngine.initialPosition(RuleSet.standard())).thenReturn(start);
        when(gamesRepository.save(any())).then(returnsFirstArg());

        // ACT
        Game game = service.start(RuleSet.standard());

        // ASSERTIONS
        assertThat(game.currentPosition()).isEqualTo(start);
        assertThat(game.status()).isEqualTo(GameStatus.ONGOING);
        assertThat(game.history()).isEmpty();
        verify(gamesRepository).save(game);
    }

    @Test
    void playPrueftMitDerEngineHaengtDenZugAnUndSpeichert() {
        // ARRANGE
        Game existing = Game.start(ID, RuleSet.standard(), start, T0);
        when(gamesRepository.findById(ID)).thenReturn(Optional.of(existing));
        when(chessEngine.isExecutable(start, e2e4, RuleSet.standard())).thenReturn(true);
        when(chessEngine.apply(start, e2e4, RuleSet.standard())).thenReturn(afterMove);
        when(gamesRepository.save(any())).then(returnsFirstArg());

        // ACT
        Game result = service.play(ID, e2e4);

        // ASSERTIONS
        assertThat(result.currentPosition()).isEqualTo(afterMove);
        assertThat(result.history()).singleElement()
            .satisfies(p -> assertThat(p.move()).isEqualTo(e2e4));
        verify(gamesRepository).save(result);
    }

    @Test
    void playLehntEinenNichtAusfuehrbarenZugAbUndSchreibtNichts() {
        // ARRANGE
        when(gamesRepository.findById(ID)).thenReturn(Optional.of(Game.start(ID, RuleSet.standard(), start, T0)));
        when(chessEngine.isExecutable(any(), any(), any())).thenReturn(false);

        // ACT & ASSERTIONS
        assertThatThrownBy(() -> service.play(ID, e2e4)).isInstanceOf(IllegalArgumentException.class);
        verify(chessEngine, never()).apply(any(), any(), any());
        verify(gamesRepository, never()).save(any());
    }

    @Test
    void playAufUnbekannterPartieWirftNotFound() {
        // ACT & ASSERTIONS
        assertThatThrownBy(() -> service.play(GameId.newId(), e2e4)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void loadAufUnbekannterPartieWirftNotFound() {
        // ACT & ASSERTIONS
        assertThatThrownBy(() -> service.load(GameId.newId())).isInstanceOf(NotFoundException.class);
    }
}

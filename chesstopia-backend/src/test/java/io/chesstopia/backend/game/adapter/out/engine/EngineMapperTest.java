package io.chesstopia.backend.game.adapter.out.engine;

import io.chesstopia.backend.game.domain.Color;
import io.chesstopia.backend.game.domain.File;
import io.chesstopia.backend.game.domain.GameOutcome;
import io.chesstopia.backend.game.domain.OutcomeKind;
import io.chesstopia.backend.game.domain.Piece;
import io.chesstopia.backend.game.domain.PieceType;
import io.chesstopia.backend.game.domain.Rank;
import io.chesstopia.backend.game.domain.Square;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Nur die von Hand geschriebenen {@code default}-Methoden — die Brücke
 * {@code Map<Square,Piece>} ↔ {@code PlacedPiece[]}. Die generierten Abbildungen
 * deckt {@link ChessEngineAdapterTest} ab.
 */
class EngineMapperTest {

    private final EngineMapper mapper = new EngineMapperImpl();

    @Test
    void toEngineBoardUebersetztFeldUndFigurNachNamen() {
        // ACT
        var board = mapper.toEngineBoard(Map.of(
            new Square(File.E, Rank.ONE), new Piece(PieceType.KING, Color.WHITE)));

        // ASSERTIONS
        assertThat(board).hasSize(1);
        assertThat(board[0].getSquare()).isEqualTo(
            new io.chesstopia.engine.Square(io.chesstopia.engine.File.E, io.chesstopia.engine.Rank.ONE));
        assertThat(board[0].getPiece()).isEqualTo(
            new io.chesstopia.engine.Piece(
                io.chesstopia.engine.PieceType.KING, io.chesstopia.engine.Color.WHITE));
    }

    @Test
    void toEngineBoardAufLeererMapGibtLeeresArray() {
        // ACT & ASSERTIONS
        assertThat(mapper.toEngineBoard(Map.of())).isEmpty();
    }

    @Test
    void toDomainBoardAufLeeremArrayGibtLeereMap() {
        // ACT & ASSERTIONS
        assertThat(mapper.toDomainBoard(new io.chesstopia.engine.PlacedPiece[0])).isEmpty();
    }

    @Test
    void brettUeberEngineUndZurueckVerliertNichts() {
        // ARRANGE
        var original = Map.of(
            new Square(File.A, Rank.ONE), new Piece(PieceType.ROOK, Color.WHITE),
            new Square(File.D, Rank.EIGHT), new Piece(PieceType.QUEEN, Color.BLACK),
            new Square(File.E, Rank.TWO), new Piece(PieceType.PAWN, Color.WHITE));

        // ACT & ASSERTIONS
        assertThat(mapper.toDomainBoard(mapper.toEngineBoard(original))).isEqualTo(original);
    }

    @Test
    void toDomainUebersetztDenAusgangBeiSchachmatt() {
        // ACT
        var outcome = mapper.toDomain(
            new io.chesstopia.engine.GameOutcome(
                io.chesstopia.engine.OutcomeKind.CHECKMATE, io.chesstopia.engine.Color.WHITE));

        // ASSERTIONS
        assertThat(outcome).isEqualTo(new GameOutcome(OutcomeKind.CHECKMATE, Color.WHITE));
    }

    @Test
    void toDomainUebersetztEinenLaufendenAusgangOhneGewinner() {
        // ACT
        var outcome = mapper.toDomain(
            new io.chesstopia.engine.GameOutcome(io.chesstopia.engine.OutcomeKind.IN_PROGRESS, null));

        // ASSERTIONS
        assertThat(outcome).isEqualTo(new GameOutcome(OutcomeKind.IN_PROGRESS, null));
    }
}

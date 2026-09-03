package io.chesstopia.backend.game.adapter.out.engine;

import io.chesstopia.backend.game.domain.Color;
import io.chesstopia.backend.game.domain.File;
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
 * deckt {@link ChessRulesAdapterTest} ab.
 */
class EngineMapperTest {

    private final EngineMapper mapper = new EngineMapperImpl();

    @Test
    void toEngineBoardUebersetztFeldUndFigurNachNamen() {
        var board = mapper.toEngineBoard(Map.of(
            new Square(File.E, Rank.ONE), new Piece(PieceType.KING, Color.WHITE)));

        assertThat(board).hasSize(1);
        assertThat(board[0].getSquare()).isEqualTo(
            new io.chesstopia.engine.Square(io.chesstopia.engine.File.E, io.chesstopia.engine.Rank.ONE));
        assertThat(board[0].getPiece()).isEqualTo(
            new io.chesstopia.engine.Piece(
                io.chesstopia.engine.PieceType.KING, io.chesstopia.engine.Color.WHITE));
    }

    @Test
    void toEngineBoardAufLeererMapGibtLeeresArray() {
        assertThat(mapper.toEngineBoard(Map.of())).isEmpty();
    }

    @Test
    void toDomainBoardAufLeeremArrayGibtLeereMap() {
        assertThat(mapper.toDomainBoard(new io.chesstopia.engine.PlacedPiece[0])).isEmpty();
    }

    @Test
    void brettUeberEngineUndZurueckVerliertNichts() {
        var original = Map.of(
            new Square(File.A, Rank.ONE), new Piece(PieceType.ROOK, Color.WHITE),
            new Square(File.D, Rank.EIGHT), new Piece(PieceType.QUEEN, Color.BLACK),
            new Square(File.E, Rank.TWO), new Piece(PieceType.PAWN, Color.WHITE));

        assertThat(mapper.toDomainBoard(mapper.toEngineBoard(original))).isEqualTo(original);
    }
}

package io.chesstopia.backend.game.domain;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class PositionTest {

    @Test
    void pieceAtFindetUndVermisstFiguren() {
        // ARRANGE
        var pos = new Position(
            Map.of(new Square(File.E, Rank.ONE), new Piece(PieceType.KING, Color.WHITE)),
            Color.WHITE, CastlingRights.all(), null, 0, 1);

        // ACT & ASSERTIONS
        assertThat(pos.pieceAt(new Square(File.E, Rank.ONE)))
            .contains(new Piece(PieceType.KING, Color.WHITE));
        assertThat(pos.pieceAt(new Square(File.E, Rank.TWO))).isEmpty();
    }

    @Test
    void diePieceMapIstNachAussenUnveraenderlich() {
        // ARRANGE
        var pieces = new java.util.HashMap<Square, Piece>();
        pieces.put(new Square(File.A, Rank.ONE), new Piece(PieceType.ROOK, Color.WHITE));
        var pos = new Position(pieces, Color.WHITE, CastlingRights.all(), null, 0, 1);

        // ACT
        // Nachträgliche Änderung an der übergebenen Map darf die Position nicht berühren.
        pieces.clear();

        // ASSERTIONS
        assertThatThrownBy(() -> pos.pieces().clear())
            .isInstanceOf(UnsupportedOperationException.class);
        assertThat(pos.pieces()).hasSize(1);
    }
}

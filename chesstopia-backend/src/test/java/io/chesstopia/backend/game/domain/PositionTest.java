package io.chesstopia.backend.game.domain;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class PositionTest {

    @Test
    void pieceAtFindetUndVermisstFiguren() {
        var pos = new Position(
            Map.of(new Square(File.E, Rank.ONE), new Piece(PieceType.KING, Color.WHITE)),
            Color.WHITE, CastlingRights.all(), null, 0, 1);
        assertThat(pos.pieceAt(new Square(File.E, Rank.ONE)))
            .contains(new Piece(PieceType.KING, Color.WHITE));
        assertThat(pos.pieceAt(new Square(File.E, Rank.TWO))).isEmpty();
    }

    @Test
    void diePieceMapIstNachAussenUnveraenderlich() {
        var pieces = new java.util.HashMap<Square, Piece>();
        pieces.put(new Square(File.A, Rank.ONE), new Piece(PieceType.ROOK, Color.WHITE));
        var pos = new Position(pieces, Color.WHITE, CastlingRights.all(), null, 0, 1);
        assertThatThrownBy(() -> pos.pieces().clear())
            .isInstanceOf(UnsupportedOperationException.class);
        // Nachträgliche Änderung an der übergebenen Map darf die Position nicht berühren.
        pieces.clear();
        assertThat(pos.pieces()).hasSize(1);
    }
}

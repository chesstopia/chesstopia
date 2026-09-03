package io.chesstopia.backend.game.adapter.out.engine;

import io.chesstopia.backend.game.domain.*;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class ChessEngineAdapterTest {

    private final ChessEngineAdapter adapter = new ChessEngineAdapter(new EngineMapperImpl());
    private final RuleSet rules = RuleSet.standard();

    @Test
    void initialPositionHatWeissAmZugUndZweiunddreissigFiguren() {
        // ACT
        Position p = adapter.initialPosition(rules);

        // ASSERTIONS
        assertThat(p.sideToMove()).isEqualTo(Color.WHITE);
        assertThat(p.pieces()).hasSize(32);
        assertThat(p.pieceAt(new Square(File.E, Rank.ONE)))
            .contains(new Piece(PieceType.KING, Color.WHITE));
    }

    @Test
    void isExecutableNimmtE2E4AnUndLehntDenZugDerFalschenSeiteAb() {
        // ARRANGE
        Position start = adapter.initialPosition(rules);

        // ACT & ASSERTIONS
        assertThat(adapter.isExecutable(start,
            new Move(new Square(File.E, Rank.TWO), new Square(File.E, Rank.FOUR), null), rules)).isTrue();
        assertThat(adapter.isExecutable(start,
            new Move(new Square(File.E, Rank.SEVEN), new Square(File.E, Rank.FIVE), null), rules)).isFalse();
    }

    @Test
    void applyFuehrtDenZugAusUndGibtEineDomaenenPositionZurueck() {
        // ARRANGE
        Position start = adapter.initialPosition(rules);

        // ACT
        Position after = adapter.apply(start,
            new Move(new Square(File.E, Rank.TWO), new Square(File.E, Rank.FOUR), null), rules);

        // ASSERTIONS
        assertThat(after.pieceAt(new Square(File.E, Rank.FOUR)))
            .contains(new Piece(PieceType.PAWN, Color.WHITE));
        assertThat(after.pieceAt(new Square(File.E, Rank.TWO))).isEmpty();
        assertThat(after.sideToMove()).isEqualTo(Color.BLACK);
        assertThat(after.enPassantTarget()).isEqualTo(new Square(File.E, Rank.THREE));
    }

    @Test
    void applyWirftBeiEinemNichtAusfuehrbarenZug() {
        // ARRANGE
        Position start = adapter.initialPosition(rules);

        // ACT & ASSERTIONS
        assertThatThrownBy(() -> adapter.apply(start,
            new Move(new Square(File.E, Rank.SEVEN), new Square(File.E, Rank.FIVE), null), rules))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void initialPositionUeberDomaeneEngineDomaeneIstDieVolleAnfangsstellung() {
        // ACT
        Position p = adapter.initialPosition(rules);

        // ASSERTIONS
        assertThat(p.pieces()).hasSize(32);
        assertThat(p.pieceAt(new Square(File.A, Rank.ONE)))
            .contains(new Piece(PieceType.ROOK, Color.WHITE));
        assertThat(p.pieceAt(new Square(File.E, Rank.ONE)))
            .contains(new Piece(PieceType.KING, Color.WHITE));
        assertThat(p.pieceAt(new Square(File.D, Rank.EIGHT)))
            .contains(new Piece(PieceType.QUEEN, Color.BLACK));
        assertThat(p.pieceAt(new Square(File.H, Rank.SEVEN)))
            .contains(new Piece(PieceType.PAWN, Color.BLACK));
        assertThat(p.castlingRights()).isEqualTo(CastlingRights.all());
        assertThat(p.enPassantTarget()).isNull();
        assertThat(p.halfmoveClock()).isZero();
        assertThat(p.fullmoveNumber()).isEqualTo(1);
    }
}

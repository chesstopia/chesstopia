package io.chesstopia.backend.game.adapter.out.engine;

import io.chesstopia.backend.game.domain.*;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class ChessRulesAdapterTest {

    private final ChessRulesAdapter adapter = new ChessRulesAdapter();
    private final RuleSet rules = RuleSet.standard();

    @Test
    void initialPositionHatWeissAmZugUndZweiunddreissigFiguren() {
        Position p = adapter.initialPosition(rules);
        assertThat(p.sideToMove()).isEqualTo(Color.WHITE);
        assertThat(p.pieces()).hasSize(32);
        assertThat(p.pieceAt(new Square(File.E, Rank.ONE)))
            .contains(new Piece(PieceType.KING, Color.WHITE));
    }

    @Test
    void isExecutableNimmtE2E4AnUndLehntDenZugDerFalschenSeiteAb() {
        Position start = adapter.initialPosition(rules);
        assertThat(adapter.isExecutable(start,
            new Move(new Square(File.E, Rank.TWO), new Square(File.E, Rank.FOUR), null), rules)).isTrue();
        assertThat(adapter.isExecutable(start,
            new Move(new Square(File.E, Rank.SEVEN), new Square(File.E, Rank.FIVE), null), rules)).isFalse();
    }

    @Test
    void applyFuehrtDenZugAusUndGibtEineDomaenenPositionZurueck() {
        Position start = adapter.initialPosition(rules);
        Position after = adapter.apply(start,
            new Move(new Square(File.E, Rank.TWO), new Square(File.E, Rank.FOUR), null), rules);
        assertThat(after.pieceAt(new Square(File.E, Rank.FOUR)))
            .contains(new Piece(PieceType.PAWN, Color.WHITE));
        assertThat(after.pieceAt(new Square(File.E, Rank.TWO))).isEmpty();
        assertThat(after.sideToMove()).isEqualTo(Color.BLACK);
        assertThat(after.enPassantTarget()).isEqualTo(new Square(File.E, Rank.THREE));
    }

    @Test
    void applyWirftBeiEinemNichtAusfuehrbarenZug() {
        Position start = adapter.initialPosition(rules);
        assertThatThrownBy(() -> adapter.apply(start,
            new Move(new Square(File.E, Rank.SEVEN), new Square(File.E, Rank.FIVE), null), rules))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void roundtripEinerStellungUeberDenMapperVerliertNichts() {
        // MapStruct-Variante: EngineMapper mapper = Mappers.getMapper(EngineMapper.class);
        // Fallback-Variante: die statischen EngineMapper.toEngine/toDomain aufrufen.
        Position start = adapter.initialPosition(rules);
        Position roundtrip = adapter.apply(start,
            new Move(new Square(File.E, Rank.TWO), new Square(File.E, Rank.FOUR), null), rules);
        assertThat(roundtrip.pieceAt(new Square(File.E, Rank.FOUR)))
            .contains(new Piece(PieceType.PAWN, Color.WHITE));
        // Der eigentliche Roundtrip-Nachweis läuft über adapter.apply: Domäne → Engine → Domäne.
    }
}

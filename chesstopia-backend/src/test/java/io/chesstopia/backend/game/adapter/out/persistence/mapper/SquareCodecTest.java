package io.chesstopia.backend.game.adapter.out.persistence.mapper;

import io.chesstopia.backend.game.domain.File;
import io.chesstopia.backend.game.domain.Rank;
import io.chesstopia.backend.game.domain.Square;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Die einzige Stelle, an der Domäne ↔ {@code "e2"}-Textform übersetzt wird. */
class SquareCodecTest {

    @Test
    void toTextIstKleineLinieUndReihennummer() {
        // ACT & ASSERTIONS
        assertThat(SquareCodec.toText(new Square(File.A, Rank.ONE))).isEqualTo("a1");
        assertThat(SquareCodec.toText(new Square(File.E, Rank.TWO))).isEqualTo("e2");
        assertThat(SquareCodec.toText(new Square(File.H, Rank.EIGHT))).isEqualTo("h8");
    }

    @Test
    void parseListDieTextformZurueck() {
        // ACT & ASSERTIONS
        assertThat(SquareCodec.parse("a1")).isEqualTo(new Square(File.A, Rank.ONE));
        assertThat(SquareCodec.parse("h8")).isEqualTo(new Square(File.H, Rank.EIGHT));
    }

    @Test
    void parseNimmtAuchGrossbuchstaben() {
        // ACT & ASSERTIONS
        assertThat(SquareCodec.parse("E2")).isEqualTo(new Square(File.E, Rank.TWO));
    }

    @Test
    void jedesFeldUeberstehtDenRoundtrip() {
        // ACT & ASSERTIONS
        for (File f : File.values()) {
            for (Rank r : Rank.values()) {
                Square sq = new Square(f, r);
                assertThat(SquareCodec.parse(SquareCodec.toText(sq))).isEqualTo(sq);
            }
        }
    }

    @Test
    void parseLehntNullUndFalscheLaengeAb() {
        // ACT & ASSERTIONS
        assertThatThrownBy(() -> SquareCodec.parse(null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> SquareCodec.parse("e")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> SquareCodec.parse("e22")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void parseLehntFelderAusserhalbDesBrettsAb() {
        // ACT & ASSERTIONS
        assertThatThrownBy(() -> SquareCodec.parse("z2")).isInstanceOf(IllegalArgumentException.class);  // Linie
        assertThatThrownBy(() -> SquareCodec.parse("e9")).isInstanceOf(IllegalArgumentException.class);  // Reihe
        assertThatThrownBy(() -> SquareCodec.parse("e0")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> SquareCodec.parse("ex")).isInstanceOf(IllegalArgumentException.class);  // keine Ziffer
    }
}

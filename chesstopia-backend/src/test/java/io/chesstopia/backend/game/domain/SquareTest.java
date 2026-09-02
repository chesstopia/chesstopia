package io.chesstopia.backend.game.domain;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SquareTest {

    @Test
    void rankNumberIstEinsBasiert() {
        assertThat(Rank.ONE.number()).isEqualTo(1);
        assertThat(Rank.EIGHT.number()).isEqualTo(8);
        assertThat(Rank.ofNumber(4)).isEqualTo(Rank.FOUR);
    }

    @Test
    void ofNumberLehntWerteAusserhalbAb() {
        assertThatThrownBy(() -> Rank.ofNumber(0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Rank.ofNumber(9)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void zweiGleicheFelderSindGleich() {
        assertThat(new Square(File.E, Rank.FOUR)).isEqualTo(new Square(File.E, Rank.FOUR));
    }
}

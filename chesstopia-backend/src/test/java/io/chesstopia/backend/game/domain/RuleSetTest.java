package io.chesstopia.backend.game.domain;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class RuleSetTest {
    @Test
    void standardHatFideVorgaben() {
        RuleSet rs = RuleSet.standard();
        assertThat(rs.variant()).isEqualTo(Variant.STANDARD);
        assertThat(rs.enPassantEnabled()).isTrue();
        assertThat(rs.castlingEnabled()).isTrue();
    }
}

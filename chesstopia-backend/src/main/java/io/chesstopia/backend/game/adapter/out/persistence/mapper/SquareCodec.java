package io.chesstopia.backend.game.adapter.out.persistence.mapper;

import io.chesstopia.backend.game.domain.File;
import io.chesstopia.backend.game.domain.Rank;
import io.chesstopia.backend.game.domain.Square;

/**
 * Die einzige Stelle, an der Domäne ↔ {@code "e2"}-Textform übersetzt wird.
 */
final class SquareCodec {
    private SquareCodec() {}

    static String toText(Square s) {
        return s.file().name().toLowerCase() + s.rank().number();
    }

    static Square parse(String text) {
        if (text == null || text.length() != 2) {
            throw new IllegalArgumentException("Kein Feldname: " + text);
        }
        return new Square(
            File.valueOf(String.valueOf(text.charAt(0)).toUpperCase()),
            Rank.ofNumber(Character.digit(text.charAt(1), 10)));
    }
}

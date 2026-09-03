package io.chesstopia.backend.game.domain;

public enum Rank {
    ONE, TWO, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT;

    public int number() { return ordinal() + 1; }

    public static Rank ofNumber(int n) {
        if (n < 1 || n > 8) throw new IllegalArgumentException("Reihe außerhalb des Bretts: " + n);
        return values()[n - 1];
    }
}

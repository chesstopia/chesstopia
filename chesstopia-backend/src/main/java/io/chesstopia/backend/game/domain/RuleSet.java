package io.chesstopia.backend.game.domain;

public record RuleSet(Variant variant, boolean enPassantEnabled, boolean castlingEnabled) {
    public static RuleSet standard() { return new RuleSet(Variant.STANDARD, true, true); }
}

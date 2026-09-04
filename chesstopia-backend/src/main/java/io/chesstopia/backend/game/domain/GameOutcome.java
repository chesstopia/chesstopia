package io.chesstopia.backend.game.domain;

/** Ergebnis der Engine-Auswertung einer Stellungsfolge. {@code winner} nur bei CHECKMATE gesetzt. */
public record GameOutcome(OutcomeKind kind, Color winner) {}

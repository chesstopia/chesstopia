package io.chesstopia.backend.game.domain;

/**
 * Ergebnis und Grund einer Partie nach der letzten Stellung einer Zugfolge.
 * {@code endReason} ist {@code null}, solange {@code status == ONGOING}.
 */
public record GameConclusion(GameStatus status, EndReason endReason) {}

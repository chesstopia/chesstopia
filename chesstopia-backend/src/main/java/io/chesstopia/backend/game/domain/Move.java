package io.chesstopia.backend.game.domain;

/** Ein Halbzug: Ausgangsfeld, Zielfeld, bei Umwandlung die Zielfigur (sonst null). */
public record Move(Square from, Square to, PieceType promotion) {}

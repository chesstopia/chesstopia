package io.chesstopia.backend.game.domain;

import java.util.Map;
import java.util.Optional;

/**
 * Eine Stellung — Figuren auf Feldern plus die fünf Angaben, die ein Zug fortführt.
 * Keine Notation: keine FEN, kein "e4".
 */
public record Position(
    Map<Square, Piece> pieces,
    Color sideToMove,
    CastlingRights castlingRights,
    Square enPassantTarget,        // nullable
    int halfmoveClock,
    int fullmoveNumber
) {
    public Position {
        pieces = Map.copyOf(pieces);
    }

    public Optional<Piece> pieceAt(Square square) {
        return Optional.ofNullable(pieces.get(square));
    }
}

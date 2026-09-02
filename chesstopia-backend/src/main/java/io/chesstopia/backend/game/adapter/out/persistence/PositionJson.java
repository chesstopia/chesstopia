package io.chesstopia.backend.game.adapter.out.persistence;

import java.util.List;

/**
 * Lesbare JSONB-Ablage einer Stellung. Keine Notation, keine FEN —
 * Feldnamen als {@code "e2"}, Enums als {@code name()}.
 */
public record PositionJson(
    List<PlacedPieceJson> board,
    String sideToMove,
    CastlingJson castling,
    String enPassantTarget,
    int halfmoveClock,
    int fullmoveNumber
) {

    public record PlacedPieceJson(String square, String type, String color) {}

    public record CastlingJson(boolean whiteKingSide, boolean whiteQueenSide,
                               boolean blackKingSide, boolean blackQueenSide) {}
}

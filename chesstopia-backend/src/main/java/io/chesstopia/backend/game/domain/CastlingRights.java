package io.chesstopia.backend.game.domain;

public record CastlingRights(boolean whiteKingSide, boolean whiteQueenSide,
                             boolean blackKingSide, boolean blackQueenSide) {
    public static CastlingRights none() { return new CastlingRights(false, false, false, false); }
    public static CastlingRights all()  { return new CastlingRights(true, true, true, true); }
}

package io.chesstopia.engine

internal fun sq(file: File, rank: Rank) = Square(file, rank)

/** Eine Stellung aus einer Handvoll gesetzter Figuren — für Mechanik-Tests. */
internal fun position(
    vararg pieces: Pair<Square, Piece>,
    sideToMove: Color = Color.WHITE,
    castlingRights: CastlingRights = CastlingRights.NONE,
    enPassantTarget: Square? = null,
    halfmoveClock: Int = 0,
    fullmoveNumber: Int = 1,
) = Position(
    pieces.map { PlacedPiece(it.first, it.second) }.toTypedArray(),
    sideToMove, castlingRights, enPassantTarget, halfmoveClock, fullmoveNumber,
)

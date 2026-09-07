package io.chesstopia.engine

internal fun Position.isCheck(): Boolean =
    isAttackedBy(kingSquare(sideToMove), sideToMove.opposite())

internal fun Position.isFiftyMoveReached(): Boolean = halfmoveClock >= 100

internal fun Position.hasInsufficientMaterial(): Boolean {
    val map = pieceMap()
    if (map.values.any { it.type == PieceType.PAWN || it.type == PieceType.ROOK || it.type == PieceType.QUEEN }) {
        return false
    }
    val minors = map.entries.filter { it.value.type == PieceType.BISHOP || it.value.type == PieceType.KNIGHT }
    return when (minors.size) {
        0, 1 -> true
        2 -> {
            val bishops = minors.filter { it.value.type == PieceType.BISHOP }
            bishops.size == 2 &&
                bishops[0].value.color != bishops[1].value.color &&
                squareShade(bishops[0].key) == squareShade(bishops[1].key)
        }
        else -> false
    }
}

private fun squareShade(s: Square): Int = (s.file.ordinal + s.rank.ordinal) % 2

internal fun Position.repetitionKey(): String {
    val board = pieceMap().entries
        .sortedBy { it.key.file.ordinal * 8 + it.key.rank.ordinal }
        .joinToString(",") { "${it.key.file}${it.key.rank}=${it.value.color}${it.value.type}" }
    val cr = castlingRights.run { "$whiteKingSide$whiteQueenSide$blackKingSide$blackQueenSide" }
    return "$board|$sideToMove|$cr|$enPassantTarget"
}

internal fun threefoldRepetition(history: Array<Position>): Boolean {
    if (history.isEmpty()) return false
    val current = history.last().repetitionKey()
    return history.count { it.repetitionKey() == current } >= 3
}

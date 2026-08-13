package io.chesstopia.engine

/**
 * Standard Algebraic Notation für einen bereits als legal geprüften Zug.
 *
 * `isCheck`/`isMate` kommen von außen, weil beide eine Simulation der
 * Zielstellung brauchen, die [getLegalMoves] für die Schach-/Matterkennung
 * ohnehin schon durchführt — diese Funktion baut nur noch die Zeichenkette.
 */
internal fun sanFor(
    move: UciMove,
    position: Position,
    legalMoves: List<UciMove>,
    isCheck: Boolean,
    isMate: Boolean,
): String {
    val piece = position.squares[move.from]!!
    val pieceType = piece.lowercaseChar()
    val suffix = when {
        isMate -> "#"
        isCheck -> "+"
        else -> ""
    }

    if (pieceType == 'k' && kotlin.math.abs(fileOf(move.from) - fileOf(move.to)) == 2) {
        val castle = if (fileOf(move.to) > fileOf(move.from)) "O-O" else "O-O-O"
        return castle + suffix
    }

    val toSquare = indexToSquare(move.to)
    val isEnPassant = pieceType == 'p' && fileOf(move.from) != fileOf(move.to) && position.squares[move.to] == null
    val isCapture = position.squares[move.to] != null || isEnPassant

    if (pieceType == 'p') {
        val body = if (isCapture) "${'a' + fileOf(move.from)}x$toSquare" else toSquare
        val promotion = move.promotion?.let { "=${it.uppercaseChar()}" } ?: ""
        return body + promotion + suffix
    }

    val pieceLetter = pieceType.uppercaseChar()
    val others = legalMoves.filter {
        it.to == move.to && it.from != move.from &&
            position.squares[it.from]?.lowercaseChar() == pieceType &&
            position.squares[it.from]?.isUpperCase() == piece.isUpperCase()
    }
    val disambiguation = when {
        others.isEmpty() -> ""
        others.none { fileOf(it.from) == fileOf(move.from) } -> "${'a' + fileOf(move.from)}"
        others.none { rankOf(it.from) == rankOf(move.from) } -> "${rankOf(move.from)}"
        else -> indexToSquare(move.from)
    }
    val captureMark = if (isCapture) "x" else ""
    return "$pieceLetter$disambiguation$captureMark$toSquare$suffix"
}

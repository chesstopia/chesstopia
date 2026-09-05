package io.chesstopia.engine.corpus

import io.chesstopia.engine.*

internal fun parseBoard(rows: List<String>): List<PlacedPiece> {
    require(rows.size == 8) { "Ein Brett hat 8 Zeilen, nicht ${rows.size}" }
    val placed = mutableListOf<PlacedPiece>()
    rows.forEachIndexed { i, raw ->
        val rank = Rank.entries[7 - i]
        val cells = raw.trim().split(Regex("\\s+"))
        val squares = if (cells.first().length == 1 && cells.first()[0].isDigit()) cells.drop(1) else cells
        require(squares.size == 8) { "Reihe braucht 8 Felder: '$raw'" }
        squares.forEachIndexed { f, token ->
            pieceFromChar(token.single())?.let { placed += PlacedPiece(Square(File.entries[f], rank), it) }
        }
    }
    return placed
}

private fun pieceFromChar(c: Char): Piece? {
    if (c == '.') return null
    val type = when (c.lowercaseChar()) {
        'k' -> PieceType.KING; 'q' -> PieceType.QUEEN; 'r' -> PieceType.ROOK
        'b' -> PieceType.BISHOP; 'n' -> PieceType.KNIGHT; 'p' -> PieceType.PAWN
        else -> throw IllegalArgumentException("Kein Figurenzeichen: '$c'")
    }
    return Piece(type, if (c.isUpperCase()) Color.WHITE else Color.BLACK)
}

internal fun renderBoard(position: Position): List<String> {
    val map = position.board.associate { it.square to it.piece }
    return (7 downTo 0).map { r ->
        val rank = Rank.entries[r]
        "${r + 1}  " + File.entries.joinToString(" ") { f -> map[Square(f, rank)]?.let(::charOf) ?: "." }
    }
}

private fun charOf(p: Piece): String {
    val c = when (p.type) {
        PieceType.KING -> "k"; PieceType.QUEEN -> "q"; PieceType.ROOK -> "r"
        PieceType.BISHOP -> "b"; PieceType.KNIGHT -> "n"; PieceType.PAWN -> "p"
    }
    return if (p.color == Color.WHITE) c.uppercase() else c
}

internal fun castlingOf(token: String): CastlingRights =
    if (token == "-") CastlingRights.NONE
    else CastlingRights('K' in token, 'Q' in token, 'k' in token, 'q' in token)

internal fun squareOf(name: String): Square? =
    if (name == "-") null
    else Square(File.entries[name[0].lowercaseChar() - 'a'], Rank.entries[name[1] - '1'])

internal fun castlingText(cr: CastlingRights): String {
    val s = buildString {
        if (cr.whiteKingSide) append('K'); if (cr.whiteQueenSide) append('Q')
        if (cr.blackKingSide) append('k'); if (cr.blackQueenSide) append('q')
    }
    return s.ifEmpty { "-" }
}

internal fun positionFrom(
    rows: List<String>, side: Color, castling: CastlingRights, ep: Square?, hm: Int, fm: Int,
): Position = Position(parseBoard(rows).toTypedArray(), side, castling, ep, hm, fm)

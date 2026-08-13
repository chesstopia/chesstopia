package io.chesstopia.engine

/**
 * Die zerlegte Form einer FEN — alle sechs Felder, nicht nur das Brett.
 *
 * Bewusst **nicht** `@JsExport`: Die Engine-Grenze trägt Zeichenketten und
 * `Move`, keine Stellungsobjekte. Was hier steht, ist Innenleben.
 *
 * Feldindizes laufen in FEN-Leserichtung — `0` ist a8, `63` ist h1. Damit
 * entspricht die Reihenfolge genau der, in der eine FEN gelesen und
 * geschrieben wird, und das Frontend indiziert sein Brett identisch.
 */
internal class Position(
    val squares: Array<Char?>,
    val whiteToMove: Boolean,
    val castling: String,
    val enPassant: String,
    val halfmoveClock: Int,
    val fullmoveNumber: Int,
) {
    init {
        require(squares.size == 64) { "Ein Brett hat 64 Felder, nicht ${squares.size}" }
    }
}

internal fun fileOf(index: Int): Int = index % 8

/** Reihe in Schachzählung: 8 für die oberste Zeile der FEN, 1 für die unterste. */
internal fun rankOf(index: Int): Int = 8 - index / 8

internal fun squareToIndex(square: String): Int {
    require(square.length == 2) { "Feldname besteht aus zwei Zeichen: $square" }
    val file = square[0] - 'a'
    val rank = square[1] - '0'
    require(file in 0..7 && rank in 1..8) { "Feld liegt außerhalb des Bretts: $square" }
    return (8 - rank) * 8 + file
}

internal fun indexToSquare(index: Int): String {
    require(index in 0..63) { "Feldindex liegt außerhalb des Bretts: $index" }
    return "${'a' + fileOf(index)}${rankOf(index)}"
}

internal fun parseFen(fen: String): Position {
    val fields = fen.trim().split(" ").filter { it.isNotEmpty() }
    require(fields.size == 6) { "Eine FEN hat sechs Felder, gefunden: ${fields.size}" }

    val squares = arrayOfNulls<Char>(64)
    val ranks = fields[0].split("/")
    require(ranks.size == 8) { "Der Brettteil einer FEN hat acht Reihen, gefunden: ${ranks.size}" }
    ranks.forEachIndexed { rankIndex, rank ->
        var file = 0
        for (symbol in rank) {
            if (symbol.isDigit()) {
                file += symbol - '0'
            } else {
                require(symbol.lowercaseChar() in "kqrbnp") { "Unbekanntes Figurensymbol: $symbol" }
                require(file < 8) { "Reihe ${8 - rankIndex} ist zu lang" }
                squares[rankIndex * 8 + file] = symbol
                file++
            }
        }
        require(file == 8) { "Reihe ${8 - rankIndex} beschreibt $file Felder statt acht" }
    }

    require(fields[1] == "w" || fields[1] == "b") { "Seite am Zug ist 'w' oder 'b': ${fields[1]}" }
    require(fields[2] == "-" || fields[2].all { it in "KQkq" }) {
        "Rochaderechte bestehen aus KQkq oder '-': ${fields[2]}"
    }
    if (fields[3] != "-") squareToIndex(fields[3])

    return Position(
        squares = squares,
        whiteToMove = fields[1] == "w",
        castling = fields[2],
        enPassant = fields[3],
        halfmoveClock = fields[4].toIntOrNull()
            ?: throw IllegalArgumentException("Halbzugzähler ist keine Zahl: ${fields[4]}"),
        fullmoveNumber = fields[5].toIntOrNull()
            ?: throw IllegalArgumentException("Vollzugnummer ist keine Zahl: ${fields[5]}"),
    )
}

internal fun Position.toFen(): String {
    val board = StringBuilder()
    for (rankIndex in 0 until 8) {
        var empty = 0
        for (file in 0 until 8) {
            val piece = squares[rankIndex * 8 + file]
            if (piece == null) {
                empty++
            } else {
                if (empty > 0) { board.append(empty); empty = 0 }
                board.append(piece)
            }
        }
        if (empty > 0) board.append(empty)
        if (rankIndex < 7) board.append('/')
    }
    val side = if (whiteToMove) "w" else "b"
    val rights = castling.ifEmpty { "-" }
    return "$board $side $rights $enPassant $halfmoveClock $fullmoveNumber"
}

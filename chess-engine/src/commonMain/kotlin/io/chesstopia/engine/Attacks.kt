package io.chesstopia.engine

/**
 * Angriffserkennung und Pseudolegal-Generierung.
 *
 * Pseudolegal heißt: Gangart korrekt, aber ob der eigene König danach im Schach
 * steht, wird hier nicht geprüft — das übernimmt [getLegalMoves] durch Simulation
 * über [Position.play]. Genau das erspart dieser Datei eine eigene
 * Fesselungs- und En-passant-Sonderfallprüfung.
 *
 * Feldindizes wie in [Fen.kt]: `0` ist a8, `63` ist h1. `row = index / 8` und
 * `col = index % 8` sind die Zeile/Spalte im Array — nicht zu verwechseln mit
 * [rankOf], der Schachreihe.
 */
private val knightDeltas = arrayOf(-2 to -1, -2 to 1, -1 to -2, -1 to 2, 1 to -2, 1 to 2, 2 to -1, 2 to 1)
private val kingDeltas = arrayOf(-1 to -1, -1 to 0, -1 to 1, 0 to -1, 0 to 1, 1 to -1, 1 to 0, 1 to 1)
private val bishopDirs = arrayOf(-1 to -1, -1 to 1, 1 to -1, 1 to 1)
private val rookDirs = arrayOf(-1 to 0, 1 to 0, 0 to -1, 0 to 1)
private val queenDirs = bishopDirs + rookDirs

internal fun Position.kingSquare(white: Boolean): Int {
    val king = if (white) 'K' else 'k'
    val square = squares.indexOfFirst { it == king }
    require(square >= 0) { "Kein König der Farbe ${if (white) "Weiß" else "Schwarz"} auf dem Brett" }
    return square
}

/** Ob [square] von einer Figur der Farbe [byWhite] angegriffen wird. */
internal fun Position.isSquareAttacked(square: Int, byWhite: Boolean): Boolean {
    val row = square / 8
    val col = square % 8

    val pawnRow = if (byWhite) row + 1 else row - 1
    val pawnPiece = if (byWhite) 'P' else 'p'
    for (dc in intArrayOf(-1, 1)) {
        val c = col + dc
        if (pawnRow in 0..7 && c in 0..7 && squares[pawnRow * 8 + c] == pawnPiece) return true
    }

    val knightPiece = if (byWhite) 'N' else 'n'
    for ((dr, dc) in knightDeltas) {
        val r = row + dr
        val c = col + dc
        if (r in 0..7 && c in 0..7 && squares[r * 8 + c] == knightPiece) return true
    }

    val kingPiece = if (byWhite) 'K' else 'k'
    for ((dr, dc) in kingDeltas) {
        val r = row + dr
        val c = col + dc
        if (r in 0..7 && c in 0..7 && squares[r * 8 + c] == kingPiece) return true
    }

    val rookPieces = if (byWhite) "RQ" else "rq"
    for ((dr, dc) in rookDirs) {
        var r = row + dr
        var c = col + dc
        while (r in 0..7 && c in 0..7) {
            val piece = squares[r * 8 + c]
            if (piece != null) {
                if (piece in rookPieces) return true
                break
            }
            r += dr
            c += dc
        }
    }

    val bishopPieces = if (byWhite) "BQ" else "bq"
    for ((dr, dc) in bishopDirs) {
        var r = row + dr
        var c = col + dc
        while (r in 0..7 && c in 0..7) {
            val piece = squares[r * 8 + c]
            if (piece != null) {
                if (piece in bishopPieces) return true
                break
            }
            r += dr
            c += dc
        }
    }

    return false
}

internal fun Position.pseudoLegalMoves(ruleSet: RuleSet): List<UciMove> {
    val moves = mutableListOf<UciMove>()
    val white = whiteToMove
    for (from in 0 until 64) {
        val piece = squares[from] ?: continue
        if (piece.isUpperCase() != white) continue
        when (piece.lowercaseChar()) {
            'p' -> pawnMoves(from, white, ruleSet, moves)
            'n' -> knightMoves(from, white, moves)
            'b' -> slidingMoves(from, white, bishopDirs, moves)
            'r' -> slidingMoves(from, white, rookDirs, moves)
            'q' -> slidingMoves(from, white, queenDirs, moves)
            'k' -> kingMoves(from, white, ruleSet, moves)
        }
    }
    return moves
}

private fun Position.pawnMoves(from: Int, white: Boolean, ruleSet: RuleSet, out: MutableList<UciMove>) {
    val row = from / 8
    val col = from % 8
    val forward = if (white) -1 else 1
    val startRow = if (white) 6 else 1
    val lastRow = if (white) 0 else 7

    val oneRow = row + forward
    if (oneRow in 0..7) {
        if (squares[oneRow * 8 + col] == null) {
            addPawnMove(from, oneRow * 8 + col, oneRow == lastRow, out)
            val twoRow = row + 2 * forward
            if (row == startRow && squares[twoRow * 8 + col] == null) {
                out += UciMove(from, twoRow * 8 + col, null)
            }
        }

        for (dc in intArrayOf(-1, 1)) {
            val c = col + dc
            if (c !in 0..7) continue
            val to = oneRow * 8 + c
            val target = squares[to]
            if (target != null && target.isUpperCase() != white) {
                addPawnMove(from, to, oneRow == lastRow, out)
            } else if (ruleSet.enPassantEnabled && enPassant != "-" && to == squareToIndex(enPassant)) {
                out += UciMove(from, to, null)
            }
        }
    }
}

private fun addPawnMove(from: Int, to: Int, promotes: Boolean, out: MutableList<UciMove>) {
    if (promotes) {
        for (piece in charArrayOf('q', 'r', 'b', 'n')) out += UciMove(from, to, piece)
    } else {
        out += UciMove(from, to, null)
    }
}

private fun Position.knightMoves(from: Int, white: Boolean, out: MutableList<UciMove>) {
    val row = from / 8
    val col = from % 8
    for ((dr, dc) in knightDeltas) {
        val r = row + dr
        val c = col + dc
        if (r !in 0..7 || c !in 0..7) continue
        val to = r * 8 + c
        val target = squares[to]
        if (target == null || target.isUpperCase() != white) out += UciMove(from, to, null)
    }
}

private fun Position.slidingMoves(from: Int, white: Boolean, dirs: Array<Pair<Int, Int>>, out: MutableList<UciMove>) {
    val row = from / 8
    val col = from % 8
    for ((dr, dc) in dirs) {
        var r = row + dr
        var c = col + dc
        while (r in 0..7 && c in 0..7) {
            val to = r * 8 + c
            val target = squares[to]
            if (target == null) {
                out += UciMove(from, to, null)
            } else {
                if (target.isUpperCase() != white) out += UciMove(from, to, null)
                break
            }
            r += dr
            c += dc
        }
    }
}

private fun Position.kingMoves(from: Int, white: Boolean, ruleSet: RuleSet, out: MutableList<UciMove>) {
    val row = from / 8
    val col = from % 8
    for ((dr, dc) in kingDeltas) {
        val r = row + dr
        val c = col + dc
        if (r !in 0..7 || c !in 0..7) continue
        val to = r * 8 + c
        val target = squares[to]
        if (target == null || target.isUpperCase() != white) out += UciMove(from, to, null)
    }

    if (!ruleSet.castlingEnabled) return
    if (isSquareAttacked(from, !white)) return

    if (white && from == 60) {
        if ('K' in castling && squares[61] == null && squares[62] == null && !isSquareAttacked(61, false)) {
            out += UciMove(60, 62, null)
        }
        if ('Q' in castling && squares[59] == null && squares[58] == null && squares[57] == null &&
            !isSquareAttacked(59, false)
        ) {
            out += UciMove(60, 58, null)
        }
    } else if (!white && from == 4) {
        if ('k' in castling && squares[5] == null && squares[6] == null && !isSquareAttacked(5, true)) {
            out += UciMove(4, 6, null)
        }
        if ('q' in castling && squares[3] == null && squares[2] == null && squares[1] == null &&
            !isSquareAttacked(3, true)
        ) {
            out += UciMove(4, 2, null)
        }
    }
}

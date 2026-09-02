package io.chesstopia.engine

import kotlin.math.abs

/**
 * Die **Mechanik** eines Zuges — was mit dem Brett passiert, wenn er ausgeführt wird.
 *
 * Ausdrücklich nicht die **Legalität**: Hier steht keine Gangart, keine Fesselung,
 * kein Schach. Ein Läufer darf sich hier wie ein Turm bewegen. Was die Mechanik
 * dagegen vollständig führt, sind die vier FEN-Felder, die sonst still veralten —
 * Rochaderechte, En-passant-Ziel, Halbzugzähler und Vollzugnummer. Genau die
 * fallen bei einem naiven „Figur von A nach B" unter den Tisch und machen jede
 * spätere Regelprüfung falsch.
 */
internal class UciMove(val from: Int, val to: Int, val promotion: Char?)

/** `null`, wenn die Zeichenkette syntaktisch kein UCI-Zug ist. */
internal fun parseUci(uci: String): UciMove? {
    if (uci.length != 4 && uci.length != 5) return null
    val from = runCatching { squareToIndex(uci.substring(0, 2)) }.getOrNull() ?: return null
    val to = runCatching { squareToIndex(uci.substring(2, 4)) }.getOrNull() ?: return null
    val promotion = if (uci.length == 5) uci[4].lowercaseChar() else null
    if (promotion != null && promotion !in "qrbn") return null
    return UciMove(from, to, promotion)
}

/** `null`, wenn der Zug mechanisch ausführbar ist — sonst der Grund im Klartext. */
internal fun FenPosition.rejectReason(move: UciMove): String? {
    if (move.from == move.to) return "Start- und Zielfeld sind identisch"
    val piece = squares[move.from]
        ?: return "Auf ${indexToSquare(move.from)} steht keine Figur"
    if (piece.isUpperCase() != whiteToMove) {
        return "${indexToSquare(move.from)} gehört nicht der Seite am Zug"
    }
    val target = squares[move.to]
    if (target != null && target.isUpperCase() == whiteToMove) {
        return "${indexToSquare(move.to)} ist durch eine eigene Figur besetzt"
    }
    if (piece.lowercaseChar() == 'p') {
        val targetRank = rankOf(move.to)
        val promotes = targetRank == 8 || targetRank == 1
        if (promotes && move.promotion == null) return "Umwandlungszug ohne Zielfigur"
        if (!promotes && move.promotion != null) return "Umwandlung außerhalb der Grundreihe"
    } else if (move.promotion != null) {
        return "Nur Bauern wandeln um"
    }
    return null
}

/**
 * Führt den Zug aus. Setzt voraus, dass [rejectReason] `null` geliefert hat.
 */
internal fun FenPosition.play(move: UciMove): FenPosition {
    val piece = squares[move.from]!!
    val isWhite = piece.isUpperCase()
    val isPawn = piece.lowercaseChar() == 'p'
    val isKing = piece.lowercaseChar() == 'k'

    val next = squares.copyOf()
    next[move.from] = null
    next[move.to] = piece

    // En passant: Das Zielfeld ist leer, der geschlagene Bauer steht daneben.
    // Ohne diesen Zweig bliebe er stehen und die Stellung wäre still falsch.
    var enPassantCapture = false
    if (isPawn && enPassant != "-" && move.to == squareToIndex(enPassant) && squares[move.to] == null) {
        next[if (isWhite) move.to + 8 else move.to - 8] = null
        enPassantCapture = true
    }

    if (isPawn && move.promotion != null) {
        next[move.to] = if (isWhite) move.promotion.uppercaseChar() else move.promotion
    }

    // Rochade wird als Königszug über zwei Linien notiert; der Turm zieht mit.
    if (isKing && abs(fileOf(move.from) - fileOf(move.to)) == 2) {
        val kingside = fileOf(move.to) == 6
        val rookFrom = if (kingside) move.to + 1 else move.to - 2
        val rookTo = if (kingside) move.to - 1 else move.to + 1
        next[rookTo] = next[rookFrom]
        next[rookFrom] = null
    }

    // Rochaderechte verfallen, sobald König oder Turm ihr Feld verlässt — und
    // ebenso, wenn der Turm auf seinem Feld geschlagen wird.
    val rights = castling.filterNot { right ->
        when (right) {
            'K' -> isKing && isWhite || move.from == 63 || move.to == 63
            'Q' -> isKing && isWhite || move.from == 56 || move.to == 56
            'k' -> isKing && !isWhite || move.from == 7 || move.to == 7
            'q' -> isKing && !isWhite || move.from == 0 || move.to == 0
            else -> false
        }
    }

    val doubleStep = isPawn && abs(rankOf(move.from) - rankOf(move.to)) == 2
    val captured = squares[move.to] != null || enPassantCapture

    return FenPosition(
        squares = next,
        whiteToMove = !whiteToMove,
        castling = rights.ifEmpty { "-" },
        enPassant = if (doubleStep) indexToSquare((move.from + move.to) / 2) else "-",
        halfmoveClock = if (isPawn || captured) 0 else halfmoveClock + 1,
        fullmoveNumber = if (whiteToMove) fullmoveNumber else fullmoveNumber + 1,
    )
}

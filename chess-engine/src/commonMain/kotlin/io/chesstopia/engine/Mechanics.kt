package io.chesstopia.engine

import kotlin.math.abs

/**
 * Die Mechanik eines Zuges — was mit dem Brett passiert, wenn er ausgeführt wird.
 *
 * Ausdrücklich NICHT die Legalität: keine Gangart, keine Fesselung, kein Schach
 * (CHESS-2). Vollständig geführt werden dagegen die fünf Zusatzfelder, die ein
 * naives "Figur von A nach B" still veralten lässt: Seite am Zug, Rochaderechte,
 * En-passant-Ziel, Halbzugzähler, Vollzugnummer.
 */
private fun Piece.isWhite() = color == Color.WHITE

/** `null`, wenn der Zug mechanisch ausführbar ist — sonst der Grund im Klartext. */
internal fun Position.rejectReason(move: Move): String? {
    if (move.from == move.to) return "Start- und Zielfeld sind identisch"
    val piece = pieceAt(move.from) ?: return "Auf ${move.from} steht keine Figur"
    if (piece.isWhite() != (sideToMove == Color.WHITE)) {
        return "${move.from} gehört nicht der Seite am Zug"
    }
    val target = pieceAt(move.to)
    if (target != null && target.isWhite() == piece.isWhite()) {
        return "${move.to} ist durch eine eigene Figur besetzt"
    }
    val promotes = piece.type == PieceType.PAWN &&
        (move.to.rank == Rank.EIGHT || move.to.rank == Rank.ONE)
    if (promotes && move.promotion == null) return "Umwandlungszug ohne Zielfigur"
    if (!promotes && move.promotion != null) {
        return if (piece.type == PieceType.PAWN) "Umwandlung außerhalb der Grundreihe"
        else "Nur Bauern wandeln um"
    }
    return null
}

/** Führt den Zug aus. Setzt voraus, dass [rejectReason] `null` geliefert hat. */
internal fun Position.play(move: Move): Position {
    val piece = pieceAt(move.from)!!
    val isWhite = piece.isWhite()
    val next = board.copyOf()
    next[move.from.boardIndex()] = null
    next[move.to.boardIndex()] = piece

    // En passant: Zielfeld leer, geschlagener Bauer steht daneben.
    var enPassantCapture = false
    if (piece.type == PieceType.PAWN && enPassantTarget == move.to && pieceAt(move.to) == null) {
        val capturedRank = if (isWhite) Rank.entries[move.to.rank.ordinal - 1]
                           else Rank.entries[move.to.rank.ordinal + 1]
        next[Square(move.to.file, capturedRank).boardIndex()] = null
        enPassantCapture = true
    }

    if (piece.type == PieceType.PAWN && move.promotion != null) {
        next[move.to.boardIndex()] = Piece(move.promotion, piece.color)
    }

    // Rochade: König zieht zwei Linien, der Turm zieht mit.
    if (piece.type == PieceType.KING && abs(move.from.file.ordinal - move.to.file.ordinal) == 2) {
        val kingside = move.to.file == File.G
        val rank = move.from.rank
        val rookFrom = Square(if (kingside) File.H else File.A, rank).boardIndex()
        val rookTo = Square(if (kingside) File.F else File.D, rank).boardIndex()
        next[rookTo] = next[rookFrom]
        next[rookFrom] = null
    }

    val rights = nextCastlingRights(move, piece)
    val doubleStep = piece.type == PieceType.PAWN &&
        abs(move.from.rank.ordinal - move.to.rank.ordinal) == 2
    val captured = pieceAt(move.to) != null || enPassantCapture

    return Position(
        board = next,
        sideToMove = if (sideToMove == Color.WHITE) Color.BLACK else Color.WHITE,
        castlingRights = rights,
        enPassantTarget = if (doubleStep) {
            val midRank = Rank.entries[(move.from.rank.ordinal + move.to.rank.ordinal) / 2]
            Square(move.from.file, midRank)
        } else null,
        halfmoveClock = if (piece.type == PieceType.PAWN || captured) 0 else halfmoveClock + 1,
        fullmoveNumber = if (sideToMove == Color.BLACK) fullmoveNumber + 1 else fullmoveNumber,
    )
}

private fun Position.nextCastlingRights(move: Move, piece: Piece): CastlingRights {
    var (wk, wq, bk, bq) = listOf(
        castlingRights.whiteKingSide, castlingRights.whiteQueenSide,
        castlingRights.blackKingSide, castlingRights.blackQueenSide,
    )
    if (piece.type == PieceType.KING && piece.isWhite()) { wk = false; wq = false }
    if (piece.type == PieceType.KING && !piece.isWhite()) { bk = false; bq = false }
    for (sq in listOf(move.from, move.to)) {
        when (sq) {
            Square(File.H, Rank.ONE) -> wk = false
            Square(File.A, Rank.ONE) -> wq = false
            Square(File.H, Rank.EIGHT) -> bk = false
            Square(File.A, Rank.EIGHT) -> bq = false
            else -> {}
        }
    }
    return CastlingRights(wk, wq, bk, bq)
}

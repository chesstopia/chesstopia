package io.chesstopia.engine

import kotlin.math.abs

internal fun Position.legalMoves(ruleSet: RuleSet): List<Move> =
    pseudoLegalMoves(ruleSet).filter { passesCheckRules(it) }

internal fun Position.isLegalMove(move: Move, ruleSet: RuleSet): Boolean =
    move in pseudoLegalMoves(ruleSet) && passesCheckRules(move)

/** Voraussetzung: `move` ist pseudo-legal (steht in `pseudoLegalMoves`). */
private fun Position.passesCheckRules(move: Move): Boolean {
    val mover = sideToMove
    val piece = pieceMap().getValue(move.from)
    val other = mover.opposite()

    if (piece.type == PieceType.KING && abs(move.from.file.ordinal - move.to.file.ordinal) == 2) {
        if (isAttackedBy(move.from, other)) return false
        val passFile = if (move.to.file == File.G) File.F else File.D
        if (isAttackedBy(Square(passFile, move.from.rank), other)) return false
    }

    val after = play(move)
    return !after.isAttackedBy(after.kingSquare(mover), other)
}

internal fun Position.illegalReason(move: Move, ruleSet: RuleSet): String {
    if (move !in pseudoLegalMoves(ruleSet)) {
        return "Zug entspricht nicht der Gangart oder der Weg ist versperrt"
    }
    val piece = pieceMap()[move.from]
    if (piece?.type == PieceType.KING && abs(move.from.file.ordinal - move.to.file.ordinal) == 2) {
        val other = sideToMove.opposite()
        if (isAttackedBy(move.from, other)) return "Rochade aus einem Schach heraus"
        val passFile = if (move.to.file == File.G) File.F else File.D
        if (isAttackedBy(Square(passFile, move.from.rank), other)) return "Rochade durch ein angegriffenes Feld"
    }
    return "Zug lässt den eigenen König im Schach"
}

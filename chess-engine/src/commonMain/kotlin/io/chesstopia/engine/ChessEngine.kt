@file:OptIn(ExperimentalJsExport::class)

package io.chesstopia.engine

import kotlin.js.ExperimentalJsExport
import kotlin.js.JsExport

/**
 * Result of a legal-moves query for a given Stellung (FEN).
 *
 * Uses Array<Move> instead of List<Move> for clean JS interop via @JsExport.
 */
@JsExport
data class LegalMovesResult(
    val moves: Array<Move>,
    val isCheck: Boolean,
    val isCheckmate: Boolean,
    val isStalemate: Boolean,
) {
    // Array equality must be structural for data class contract
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || this::class != other::class) return false
        other as LegalMovesResult
        return moves.contentEquals(other.moves)
            && isCheck == other.isCheck
            && isCheckmate == other.isCheckmate
            && isStalemate == other.isStalemate
    }

    override fun hashCode(): Int {
        var result = moves.contentHashCode()
        result = 31 * result + isCheck.hashCode()
        result = 31 * result + isCheckmate.hashCode()
        result = 31 * result + isStalemate.hashCode()
        return result
    }
}

/**
 * Die Grundstellung für eine neue Partie mit diesem RuleSet.
 * Chess960 & Co. folgen mit ihrer eigenen Aufstellung — heute nur Standard.
 */
@JsExport
fun initialPosition(ruleSet: RuleSet): Position = standardStartPosition()

/**
 * Alle legalen Züge der Seite am Zug. Noch nicht implementiert (CHESS-2).
 */
@JsExport
fun getLegalMoves(position: Position, ruleSet: RuleSet): LegalMovesResult {
    TODO("Chess rule logic not yet implemented — tracked in CHESS-2")
}

@JsExport
enum class OutcomeKind {
    IN_PROGRESS,
    CHECKMATE,
    STALEMATE,
    DRAW_FIFTY_MOVE,
    DRAW_INSUFFICIENT_MATERIAL,
    DRAW_THREEFOLD_REPETITION,
}

@JsExport
data class GameOutcome(val kind: OutcomeKind, val winner: Color?)

/**
 * Der Zustand der Partie nach der letzten Stellung in [history].
 * Nimmt die Historie, weil die Dreifachwiederholung sie braucht; das letzte
 * Element ist die aktuelle Stellung.
 */
@JsExport
fun gameOutcome(history: Array<Position>, ruleSet: RuleSet): GameOutcome {
    require(history.isNotEmpty()) { "history darf nicht leer sein" }
    val pos = history.last()
    if (pos.legalMoves(ruleSet).isEmpty()) {
        return if (pos.isCheck()) GameOutcome(OutcomeKind.CHECKMATE, pos.sideToMove.opposite())
        else GameOutcome(OutcomeKind.STALEMATE, null)
    }
    return when {
        pos.isFiftyMoveReached() -> GameOutcome(OutcomeKind.DRAW_FIFTY_MOVE, null)
        pos.hasInsufficientMaterial() -> GameOutcome(OutcomeKind.DRAW_INSUFFICIENT_MATERIAL, null)
        threefoldRepetition(history) -> GameOutcome(OutcomeKind.DRAW_THREEFOLD_REPETITION, null)
        else -> GameOutcome(OutcomeKind.IN_PROGRESS, null)
    }
}

/** Ob der Zug in dieser Stellung nach den Regeln legal ist (Gangart, Weg, Fesselung, Schach). */
@JsExport
fun validateMove(position: Position, move: Move, ruleSet: RuleSet): Boolean =
    position.isLegalMove(move, ruleSet)

/**
 * Führt den legalen Zug aus und liefert die neue Stellung.
 * @throws IllegalArgumentException wenn der Zug nicht legal ist — mit dem Grund im Klartext.
 */
@JsExport
fun applyMove(position: Position, move: Move, ruleSet: RuleSet): Position {
    position.rejectReason(move)?.let { throw IllegalArgumentException(it) }
    if (!position.isLegalMove(move, ruleSet)) {
        throw IllegalArgumentException(position.illegalReason(move, ruleSet))
    }
    return position.play(move)
}

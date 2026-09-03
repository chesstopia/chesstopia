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

/**
 * Ob der Zug in dieser Stellung MECHANISCH ausführbar ist — nicht, ob er legal ist.
 * Gangart, Fesselung und Schach werden nicht geprüft (CHESS-2).
 */
@JsExport
fun validateMove(position: Position, move: Move, ruleSet: RuleSet): Boolean =
    position.rejectReason(move) == null

/**
 * Führt den Zug aus und liefert die neue Stellung. Prüft die Legalität nicht.
 * @throws IllegalArgumentException wenn der Zug nicht mechanisch ausführbar ist.
 */
@JsExport
fun applyMove(position: Position, move: Move, ruleSet: RuleSet): Position {
    position.rejectReason(move)?.let { throw IllegalArgumentException(it) }
    return position.play(move)
}

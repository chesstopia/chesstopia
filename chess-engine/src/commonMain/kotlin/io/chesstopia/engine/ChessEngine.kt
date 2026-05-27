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
 * Returns all legal moves for the side to move in the given Stellung.
 *
 * @param fen     The board state in FEN notation (canonical interchange format).
 * @param ruleSet The active rule configuration for the Partie.
 * @return        Legal moves plus check/checkmate/stalemate flags.
 */
@JsExport
fun getLegalMoves(fen: String, ruleSet: RuleSet): LegalMovesResult {
    TODO("Chess rule logic not yet implemented — tracked in CHESS-2")
}

/**
 * Validates whether a move (given in UCI notation) is legal in the given Stellung.
 *
 * @param fen      The board state in FEN notation.
 * @param uciMove  The move to validate in UCI notation, e.g. "e2e4", "e7e8q".
 * @param ruleSet  The active rule configuration for the Partie.
 * @return         true if the move is legal, false otherwise.
 */
@JsExport
fun validateMove(fen: String, uciMove: String, ruleSet: RuleSet): Boolean {
    TODO("Chess rule logic not yet implemented — tracked in CHESS-2")
}

/**
 * Applies a legal move to a Stellung and returns the resulting FEN.
 *
 * @param fen      The current board state in FEN notation.
 * @param uciMove  The move to apply in UCI notation.
 * @param ruleSet  The active rule configuration for the Partie.
 * @return         The FEN string of the Stellung after the move.
 */
@JsExport
fun applyMove(fen: String, uciMove: String, ruleSet: RuleSet): String {
    TODO("Chess rule logic not yet implemented — tracked in CHESS-2")
}

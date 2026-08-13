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
 * Checks whether a move (given in UCI notation) is **mechanically executable**
 * in the given Stellung.
 *
 * Not to be confused with legality: this asks only whether a piece of the side
 * to move stands on the origin square and whether the target square is free of
 * its own pieces. Gangart, Fesselung und Schach werden nicht geprüft — das ist
 * CHESS-2. Bis dahin nimmt diese Funktion Züge an, die kein Schachspieler
 * spielen würde.
 *
 * @param fen      The board state in FEN notation.
 * @param uciMove  The move to validate in UCI notation, e.g. "e2e4", "e7e8q".
 * @param ruleSet  The active rule configuration for the Partie.
 * @return         true if the move can be executed, false otherwise.
 * @throws IllegalArgumentException if the FEN itself cannot be parsed.
 */
@JsExport
fun validateMove(fen: String, uciMove: String, ruleSet: RuleSet): Boolean {
    val position = parseFen(fen)
    val move = parseUci(uciMove) ?: return false
    return position.rejectReason(move) == null
}

/**
 * Applies a move to a Stellung and returns the resulting FEN.
 *
 * Führt alle sechs FEN-Felder fort, nicht nur das Brett: Rochaderechte,
 * En-passant-Ziel, Halbzugzähler und Vollzugnummer. Prüft die Legalität nicht —
 * siehe [validateMove].
 *
 * @param fen      The current board state in FEN notation.
 * @param uciMove  The move to apply in UCI notation.
 * @param ruleSet  The active rule configuration for the Partie.
 * @return         The FEN string of the Stellung after the move.
 * @throws IllegalArgumentException if FEN or move cannot be parsed, or if the
 *                                  move is not mechanically executable.
 */
@JsExport
fun applyMove(fen: String, uciMove: String, ruleSet: RuleSet): String {
    val position = parseFen(fen)
    val move = parseUci(uciMove)
        ?: throw IllegalArgumentException("Kein gültiger UCI-Zug: $uciMove")
    position.rejectReason(move)?.let { throw IllegalArgumentException(it) }
    return position.play(move).toFen()
}

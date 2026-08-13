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
    val isFiftyMoveDraw: Boolean,
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
            && isFiftyMoveDraw == other.isFiftyMoveDraw
    }

    override fun hashCode(): Int {
        var result = moves.contentHashCode()
        result = 31 * result + isCheck.hashCode()
        result = 31 * result + isCheckmate.hashCode()
        result = 31 * result + isStalemate.hashCode()
        result = 31 * result + isFiftyMoveDraw.hashCode()
        return result
    }
}

/**
 * Returns all legal moves for the side to move in the given Stellung.
 *
 * Pseudolegale Züge werden über [Position.play] simuliert; wessen eigener König
 * danach im Schach steht, fällt heraus. Das behandelt Fesselung und den
 * En-passant-Sonderfall (Schlag deckt die eigene Reihe auf) ohne Sonderfallcode.
 *
 * @param fen     The board state in FEN notation (canonical interchange format).
 * @param ruleSet The active rule configuration for the Partie.
 * @return        Legal moves plus check/checkmate/stalemate/fifty-move flags.
 */
@JsExport
fun getLegalMoves(fen: String, ruleSet: RuleSet): LegalMovesResult {
    val position = parseFen(fen)
    val mover = position.whiteToMove
    val legalUci = position.legalUciMoves(ruleSet)
    val isCheck = position.isSquareAttacked(position.kingSquare(mover), byWhite = !mover)
    val isCheckmate = isCheck && legalUci.isEmpty()
    val isStalemate = !isCheck && legalUci.isEmpty()
    val isFiftyMoveDraw = position.halfmoveClock >= 100

    val moves = legalUci.map { move ->
        val next = position.play(move)
        val givesCheck = next.isSquareAttacked(next.kingSquare(!mover), byWhite = mover)
        val givesMate = givesCheck && next.legalUciMoves(ruleSet).isEmpty()
        Move(
            san = sanFor(move, position, legalUci, givesCheck, givesMate),
            uci = move.toUci(),
            from = indexToSquare(move.from),
            to = indexToSquare(move.to),
            promotion = move.promotion?.toString(),
        )
    }.toTypedArray()

    return LegalMovesResult(moves, isCheck, isCheckmate, isStalemate, isFiftyMoveDraw)
}

/**
 * Checks whether a move (given in UCI notation) is legal in the given Stellung —
 * Gangart, Fesselung und Schach eingeschlossen.
 *
 * @param fen      The board state in FEN notation.
 * @param uciMove  The move to validate in UCI notation, e.g. "e2e4", "e7e8q".
 * @param ruleSet  The active rule configuration for the Partie.
 * @return         true if the move is legal, false otherwise.
 * @throws IllegalArgumentException if the FEN itself cannot be parsed.
 */
@JsExport
fun validateMove(fen: String, uciMove: String, ruleSet: RuleSet): Boolean {
    val position = parseFen(fen)
    val move = parseUci(uciMove) ?: return false
    return position.legalUciMoves(ruleSet).any { it.from == move.from && it.to == move.to && it.promotion == move.promotion }
}

/**
 * Applies a move to a Stellung and returns the resulting FEN.
 *
 * Führt alle sechs FEN-Felder fort, nicht nur das Brett: Rochaderechte,
 * En-passant-Ziel, Halbzugzähler und Vollzugnummer. Prüft dieselbe Legalität wie
 * [validateMove], bevor der Zug ausgeführt wird.
 *
 * @param fen      The current board state in FEN notation.
 * @param uciMove  The move to apply in UCI notation.
 * @param ruleSet  The active rule configuration for the Partie.
 * @return         The FEN string of the Stellung after the move.
 * @throws IllegalArgumentException if FEN or move cannot be parsed, or if the
 *                                  move is not legal.
 */
@JsExport
fun applyMove(fen: String, uciMove: String, ruleSet: RuleSet): String {
    val position = parseFen(fen)
    val move = parseUci(uciMove)
        ?: throw IllegalArgumentException("Kein gültiger UCI-Zug: $uciMove")
    val isLegal = position.legalUciMoves(ruleSet)
        .any { it.from == move.from && it.to == move.to && it.promotion == move.promotion }
    if (!isLegal) throw IllegalArgumentException("Der Zug '$uciMove' ist in dieser Stellung nicht legal")
    return position.play(move).toFen()
}

private fun Position.legalUciMoves(ruleSet: RuleSet): List<UciMove> {
    val mover = whiteToMove
    return pseudoLegalMoves(ruleSet).filter { move ->
        val next = play(move)
        !next.isSquareAttacked(next.kingSquare(mover), byWhite = !mover)
    }
}

private fun UciMove.toUci(): String =
    indexToSquare(from) + indexToSquare(to) + (promotion?.toString() ?: "")

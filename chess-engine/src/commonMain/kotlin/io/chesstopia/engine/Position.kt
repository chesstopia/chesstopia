@file:OptIn(ExperimentalJsExport::class)

package io.chesstopia.engine

import kotlin.js.ExperimentalJsExport
import kotlin.js.JsExport

/**
 * Eine Stellung — das Brett und die fünf Zusatzangaben, die ein Zug fortführt.
 *
 * `board` ist ein flaches Array der Länge 64, Index 0 = a8 (siehe Vocabulary.kt).
 * `Array` statt `List` wegen @JsExport (ADR-0007); equals/hashCode deshalb von Hand.
 */
@JsExport
data class Position(
    val board: Array<Piece?>,
    val sideToMove: Color,
    val castlingRights: CastlingRights,
    val enPassantTarget: Square?,
    val halfmoveClock: Int,
    val fullmoveNumber: Int,
) {
    init { require(board.size == 64) { "Ein Brett hat 64 Felder, nicht ${board.size}" } }

    fun pieceAt(square: Square): Piece? = board[square.boardIndex()]

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Position) return false
        return board.contentEquals(other.board)
            && sideToMove == other.sideToMove
            && castlingRights == other.castlingRights
            && enPassantTarget == other.enPassantTarget
            && halfmoveClock == other.halfmoveClock
            && fullmoveNumber == other.fullmoveNumber
    }

    override fun hashCode(): Int {
        var r = board.contentHashCode()
        r = 31 * r + sideToMove.hashCode()
        r = 31 * r + castlingRights.hashCode()
        r = 31 * r + (enPassantTarget?.hashCode() ?: 0)
        r = 31 * r + halfmoveClock
        r = 31 * r + fullmoveNumber
        return r
    }
}

internal fun standardStartPosition(): Position {
    val board = arrayOfNulls<Piece>(64)
    val backRank = listOf(
        PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
        PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK,
    )
    for (file in File.entries) {
        board[Square(file, Rank.EIGHT).boardIndex()] = Piece(backRank[file.ordinal], Color.BLACK)
        board[Square(file, Rank.SEVEN).boardIndex()] = Piece(PieceType.PAWN, Color.BLACK)
        board[Square(file, Rank.TWO).boardIndex()] = Piece(PieceType.PAWN, Color.WHITE)
        board[Square(file, Rank.ONE).boardIndex()] = Piece(backRank[file.ordinal], Color.WHITE)
    }
    return Position(board, Color.WHITE, CastlingRights.ALL, null, 0, 1)
}

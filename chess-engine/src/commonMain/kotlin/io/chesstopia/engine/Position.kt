@file:OptIn(ExperimentalJsExport::class)

package io.chesstopia.engine

import kotlin.js.ExperimentalJsExport
import kotlin.js.JsExport

/**
 * Eine Stellung — das Brett und die fünf Zusatzangaben, die ein Zug fortführt.
 *
 * `board` listet nur die besetzten Felder auf, als [PlacedPiece]-Paare — dieselbe
 * Form wie der REST-Kontrakt und die Persistenz. Kein Feldindex, keine
 * Leserichtung: ein Feld hat eine Figur oder es steht nicht in der Liste.
 * `Array` statt `List` wegen @JsExport (ADR-0007); equals/hashCode deshalb von
 * Hand und reihenfolgeunabhängig.
 */
@JsExport
data class Position(
    val board: Array<PlacedPiece>,
    val sideToMove: Color,
    val castlingRights: CastlingRights,
    val enPassantTarget: Square?,
    val halfmoveClock: Int,
    val fullmoveNumber: Int,
) {
    init {
        require(board.map { it.square }.toSet().size == board.size) {
            "Ein Feld ist doppelt besetzt"
        }
    }

    fun pieceAt(square: Square): Piece? = board.firstOrNull { it.square == square }?.piece

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Position) return false
        return pieceMap() == other.pieceMap()
            && sideToMove == other.sideToMove
            && castlingRights == other.castlingRights
            && enPassantTarget == other.enPassantTarget
            && halfmoveClock == other.halfmoveClock
            && fullmoveNumber == other.fullmoveNumber
    }

    override fun hashCode(): Int {
        var r = pieceMap().hashCode()
        r = 31 * r + sideToMove.hashCode()
        r = 31 * r + castlingRights.hashCode()
        r = 31 * r + (enPassantTarget?.hashCode() ?: 0)
        r = 31 * r + halfmoveClock
        r = 31 * r + fullmoveNumber
        return r
    }
}

/** Das Brett als Nachschlagewerk — die interne Sicht der Mechanik. */
internal fun Position.pieceMap(): Map<Square, Piece> = board.associate { it.square to it.piece }

internal fun standardStartPosition(): Position {
    val backRank = listOf(
        PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
        PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK,
    )
    val pieces = buildList {
        for (file in File.entries) {
            add(PlacedPiece(Square(file, Rank.EIGHT), Piece(backRank[file.ordinal], Color.BLACK)))
            add(PlacedPiece(Square(file, Rank.SEVEN), Piece(PieceType.PAWN, Color.BLACK)))
            add(PlacedPiece(Square(file, Rank.TWO), Piece(PieceType.PAWN, Color.WHITE)))
            add(PlacedPiece(Square(file, Rank.ONE), Piece(backRank[file.ordinal], Color.WHITE)))
        }
    }
    return Position(pieces.toTypedArray(), Color.WHITE, CastlingRights.ALL, null, 0, 1)
}

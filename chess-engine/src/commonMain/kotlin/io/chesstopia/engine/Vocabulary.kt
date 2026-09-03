@file:OptIn(ExperimentalJsExport::class)

package io.chesstopia.engine

import kotlin.js.ExperimentalJsExport
import kotlin.js.JsExport

@JsExport enum class Color { WHITE, BLACK }

@JsExport enum class PieceType { KING, QUEEN, ROOK, BISHOP, KNIGHT, PAWN }

@JsExport data class Piece(val type: PieceType, val color: Color)

@JsExport enum class File { A, B, C, D, E, F, G, H }

@JsExport enum class Rank { ONE, TWO, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT }

@JsExport data class Square(val file: File, val rank: Rank)

/** Eine Figur auf einem Feld. Ein besetztes Feld einer [Position]. */
@JsExport data class PlacedPiece(val square: Square, val piece: Piece)

@JsExport data class CastlingRights(
    val whiteKingSide: Boolean,
    val whiteQueenSide: Boolean,
    val blackKingSide: Boolean,
    val blackQueenSide: Boolean,
) {
    companion object {
        val NONE = CastlingRights(false, false, false, false)
        val ALL = CastlingRights(true, true, true, true)
    }
}

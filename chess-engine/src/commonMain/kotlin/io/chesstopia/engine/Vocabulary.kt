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

internal fun Square.boardIndex(): Int = (7 - rank.ordinal) * 8 + file.ordinal

internal fun squareAt(index: Int): Square {
    require(index in 0 until 64) { "Feldindex außerhalb des Bretts: $index" }
    return Square(File.entries[index % 8], Rank.entries[7 - index / 8])
}

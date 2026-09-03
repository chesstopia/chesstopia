package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertEquals

class VocabularyTest {

    @Test
    fun `CastlingRights ALL und NONE sind die beiden Vollausschlaege`() {
        assertEquals(CastlingRights(true, true, true, true), CastlingRights.ALL)
        assertEquals(CastlingRights(false, false, false, false), CastlingRights.NONE)
    }

    @Test
    fun `PlacedPiece ist strukturell gleich bei gleichem Feld und gleicher Figur`() {
        assertEquals(
            PlacedPiece(Square(File.E, Rank.TWO), Piece(PieceType.PAWN, Color.WHITE)),
            PlacedPiece(Square(File.E, Rank.TWO), Piece(PieceType.PAWN, Color.WHITE)),
        )
    }
}

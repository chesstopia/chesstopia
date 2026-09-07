package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import kotlin.test.assertEquals

class AttacksTest {

    @Test fun `ein Turm greift entlang der freien Linie an, ein Blocker stoppt ihn`() {
        // ARRANGE
        val p = position(
            sq(File.A, Rank.ONE) to Piece(PieceType.ROOK, Color.WHITE),
            sq(File.A, Rank.FIVE) to Piece(PieceType.KING, Color.BLACK),
        )
        val blocked = position(
            sq(File.A, Rank.ONE) to Piece(PieceType.ROOK, Color.WHITE),
            sq(File.A, Rank.THREE) to Piece(PieceType.PAWN, Color.BLACK),
            sq(File.A, Rank.FIVE) to Piece(PieceType.KING, Color.BLACK),
        )

        // ACT & ASSERTIONS
        assertTrue(p.isAttackedBy(sq(File.A, Rank.FIVE), Color.WHITE))
        assertFalse(blocked.isAttackedBy(sq(File.A, Rank.FIVE), Color.WHITE))
    }

    @Test fun `ein Bauer greift diagonal nach vorn an, nicht gerade`() {
        // ARRANGE
        val p = position(sq(File.E, Rank.FOUR) to Piece(PieceType.PAWN, Color.WHITE))

        // ACT & ASSERTIONS
        assertTrue(p.isAttackedBy(sq(File.D, Rank.FIVE), Color.WHITE))
        assertTrue(p.isAttackedBy(sq(File.F, Rank.FIVE), Color.WHITE))
        assertFalse(p.isAttackedBy(sq(File.E, Rank.FIVE), Color.WHITE))
        assertFalse(p.isAttackedBy(sq(File.D, Rank.THREE), Color.WHITE))
    }

    @Test fun `Springer und Koenig greifen nach Muster an`() {
        // ARRANGE
        val p = position(
            sq(File.D, Rank.FOUR) to Piece(PieceType.KNIGHT, Color.BLACK),
            sq(File.G, Rank.SEVEN) to Piece(PieceType.KING, Color.BLACK),
        )

        // ACT & ASSERTIONS
        assertTrue(p.isAttackedBy(sq(File.E, Rank.SIX), Color.BLACK))   // Springer
        assertTrue(p.isAttackedBy(sq(File.G, Rank.SIX), Color.BLACK))   // König
        assertFalse(p.isAttackedBy(sq(File.E, Rank.FIVE), Color.BLACK))
    }

    @Test fun `kingSquare findet den Koenig, opposite kippt die Farbe`() {
        // ARRANGE
        val p = position(sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE))

        // ACT & ASSERTIONS
        assertEquals(sq(File.E, Rank.ONE), p.kingSquare(Color.WHITE))
        assertEquals(Color.BLACK, Color.WHITE.opposite())
    }
}

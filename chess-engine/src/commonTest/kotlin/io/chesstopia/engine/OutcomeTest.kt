package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class OutcomeTest {

    @Test fun `isCheck erkennt das Schachgebot gegen die Seite am Zug`() {
        // ARRANGE
        val p = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.E, Rank.EIGHT) to Piece(PieceType.ROOK, Color.BLACK),
            sideToMove = Color.WHITE,
        )

        // ACT & ASSERTIONS
        assertTrue(p.isCheck())
    }

    @Test fun `50-Zuege-Regel greift ab 100 Halbzuegen`() {
        // ACT & ASSERTIONS
        assertFalse(position(halfmoveClock = 99).isFiftyMoveReached())
        assertTrue(position(halfmoveClock = 100).isFiftyMoveReached())
    }

    @Test fun `ungenuegendes Material — K-K, K+Läufer-K, gleichfarbige Läufer`() {
        // ARRANGE
        val kk = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.E, Rank.EIGHT) to Piece(PieceType.KING, Color.BLACK),
        )
        val kbk = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.C, Rank.ONE) to Piece(PieceType.BISHOP, Color.WHITE),
            sq(File.E, Rank.EIGHT) to Piece(PieceType.KING, Color.BLACK),
        )
        val kbkbSame = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.C, Rank.ONE) to Piece(PieceType.BISHOP, Color.WHITE),   // c1 dunkel
            sq(File.E, Rank.EIGHT) to Piece(PieceType.KING, Color.BLACK),
            sq(File.F, Rank.EIGHT) to Piece(PieceType.BISHOP, Color.BLACK), // f8 dunkel
        )
        val withPawn = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.A, Rank.TWO) to Piece(PieceType.PAWN, Color.WHITE),
            sq(File.E, Rank.EIGHT) to Piece(PieceType.KING, Color.BLACK),
        )

        // ACT & ASSERTIONS
        assertTrue(kk.hasInsufficientMaterial())
        assertTrue(kbk.hasInsufficientMaterial())
        assertTrue(kbkbSame.hasInsufficientMaterial())
        assertFalse(withPawn.hasInsufficientMaterial())
    }

    @Test fun `threefoldRepetition zaehlt gleiche Stellungen inklusive der aktuellen`() {
        // ARRANGE
        val a = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.E, Rank.EIGHT) to Piece(PieceType.KING, Color.BLACK),
        )
        val b = a.copy(sideToMove = Color.BLACK)

        // ACT & ASSERTIONS
        assertFalse(threefoldRepetition(arrayOf(a, b, a)))
        assertTrue(threefoldRepetition(arrayOf(a, b, a, b, a)))
    }
}

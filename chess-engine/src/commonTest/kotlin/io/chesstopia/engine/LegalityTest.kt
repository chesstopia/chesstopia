package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import kotlin.test.assertContains

class LegalityTest {

    private val rules = RuleSet.standard()

    @Test fun `eine gefesselte Figur darf die Fessel nicht verlassen, aber auf der Linie ziehen`() {
        // ARRANGE — weißer Turm e2 gefesselt durch schwarzen Turm e8 auf König e1
        val p = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.E, Rank.TWO) to Piece(PieceType.ROOK, Color.WHITE),
            sq(File.E, Rank.EIGHT) to Piece(PieceType.ROOK, Color.BLACK),
        )

        // ACT & ASSERTIONS
        assertFalse(p.isLegalMove(Move(sq(File.E, Rank.TWO), sq(File.C, Rank.TWO)), rules)) // verlässt die e-Linie
        assertTrue(p.isLegalMove(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.FOUR)), rules))  // bleibt auf der Linie
        assertTrue(p.isLegalMove(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.EIGHT)), rules)) // schlägt den Fessler
    }

    @Test fun `der Koenig darf nicht in ein angegriffenes Feld ziehen`() {
        // ARRANGE
        val p = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.A, Rank.TWO) to Piece(PieceType.ROOK, Color.BLACK),
        )

        // ACT & ASSERTIONS
        assertFalse(p.isLegalMove(Move(sq(File.E, Rank.ONE), sq(File.E, Rank.TWO)), rules))
        assertTrue(p.isLegalMove(Move(sq(File.E, Rank.ONE), sq(File.D, Rank.ONE)), rules))
    }

    @Test fun `Rochade nicht aus dem Schach und nicht durch ein angegriffenes Feld`() {
        // ARRANGE
        val outOfCheck = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.H, Rank.ONE) to Piece(PieceType.ROOK, Color.WHITE),
            sq(File.E, Rank.EIGHT) to Piece(PieceType.ROOK, Color.BLACK),
            castlingRights = CastlingRights.ALL,
        )
        val throughCheck = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.H, Rank.ONE) to Piece(PieceType.ROOK, Color.WHITE),
            sq(File.F, Rank.EIGHT) to Piece(PieceType.ROOK, Color.BLACK),
            castlingRights = CastlingRights.ALL,
        )

        // ACT & ASSERTIONS
        assertFalse(outOfCheck.isLegalMove(Move(sq(File.E, Rank.ONE), sq(File.G, Rank.ONE)), rules))
        assertFalse(throughCheck.isLegalMove(Move(sq(File.E, Rank.ONE), sq(File.G, Rank.ONE)), rules))
    }

    @Test fun `legalMoves der Grundstellung sind 20`() {
        // ACT & ASSERTIONS
        kotlin.test.assertEquals(20, standardStartPosition().legalMoves(rules).size)
    }

    @Test fun `illegalReason benennt Selbstschach und versperrte Gangart`() {
        // ARRANGE
        val pinned = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.E, Rank.TWO) to Piece(PieceType.ROOK, Color.WHITE),
            sq(File.E, Rank.EIGHT) to Piece(PieceType.ROOK, Color.BLACK),
        )

        // ACT & ASSERTIONS
        assertContains(
            pinned.illegalReason(Move(sq(File.E, Rank.TWO), sq(File.C, Rank.TWO)), rules).lowercase(),
            "schach",
        )
        assertContains(
            standardStartPosition().illegalReason(Move(sq(File.A, Rank.ONE), sq(File.A, Rank.FOUR)), rules).lowercase(),
            "gangart",
        )
    }
}

package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ChessEngineTest {

    private val rules = RuleSet.standard()
    private val start = standardStartPosition()
    private fun sq(f: File, r: Rank) = Square(f, r)
    private val e2e4 = Move(sq(File.E, Rank.TWO), sq(File.E, Rank.FOUR))

    @Test fun `initialPosition liefert die Grundstellung`() {
        assertEquals(standardStartPosition(), initialPosition(rules))
    }

    @Test fun `getLegalMoves bleibt bis CHESS-2 nicht implementiert`() {
        assertFailsWith<NotImplementedError> { getLegalMoves(start, rules) }
    }

    @Test fun `validateMove nimmt einen mechanisch moeglichen Zug an, auch einen unschachlichen`() {
        assertTrue(validateMove(start, e2e4, rules))
        assertTrue(validateMove(start, Move(sq(File.A, Rank.ONE), sq(File.A, Rank.EIGHT)), rules))
    }

    @Test fun `validateMove lehnt den Zug der falschen Seite ab`() {
        assertFalse(validateMove(start, Move(sq(File.E, Rank.SEVEN), sq(File.E, Rank.FIVE)), rules))
    }

    @Test fun `validateMove verlangt eine Zielfigur bei der Umwandlung`() {
        val board = arrayOfNulls<Piece>(64)
        board[sq(File.E, Rank.SEVEN).boardIndex()] = Piece(PieceType.PAWN, Color.WHITE)
        val p = Position(board, Color.WHITE, CastlingRights.NONE, null, 0, 1)
        assertFalse(validateMove(p, Move(sq(File.E, Rank.SEVEN), sq(File.E, Rank.EIGHT)), rules))
        assertTrue(validateMove(p, Move(sq(File.E, Rank.SEVEN), sq(File.E, Rank.EIGHT), PieceType.QUEEN), rules))
    }

    @Test fun `applyMove wirft bei einem mechanisch unmoeglichen Zug`() {
        assertFailsWith<IllegalArgumentException> {
            applyMove(start, Move(sq(File.E, Rank.SEVEN), sq(File.E, Rank.FIVE)), rules)
        }
    }

    @Test fun `applyMove fuehrt den Zug aus`() {
        val after = applyMove(start, e2e4, rules)
        assertEquals(Piece(PieceType.PAWN, Color.WHITE), after.pieceAt(sq(File.E, Rank.FOUR)))
    }

    @Test fun `RuleSet standard hat die erwarteten Vorgaben`() {
        val rs = RuleSet.standard()
        assertEquals(Variant.STANDARD, rs.variant)
        assertTrue(rs.enPassantEnabled)
        assertTrue(rs.castlingEnabled)
    }
}

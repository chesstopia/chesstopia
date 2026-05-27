package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertFailsWith
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ChessEngineTest {

    private val initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

    @Test
    fun `getLegalMoves throws NotImplementedError until engine is implemented`() {
        assertFailsWith<NotImplementedError> {
            getLegalMoves(initialFen, RuleSet.standard())
        }
    }

    @Test
    fun `validateMove throws NotImplementedError until engine is implemented`() {
        assertFailsWith<NotImplementedError> {
            validateMove(initialFen, "e2e4", RuleSet.standard())
        }
    }

    @Test
    fun `applyMove throws NotImplementedError until engine is implemented`() {
        assertFailsWith<NotImplementedError> {
            applyMove(initialFen, "e2e4", RuleSet.standard())
        }
    }

    @Test
    fun `RuleSet standard() has expected defaults`() {
        val rs = RuleSet.standard()
        assertEquals(Variant.STANDARD, rs.variant)
        assertTrue(rs.enPassantEnabled)
        assertTrue(rs.castlingEnabled)
    }
}

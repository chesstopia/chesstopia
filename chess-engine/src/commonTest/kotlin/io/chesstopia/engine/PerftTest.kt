package io.chesstopia.engine

import io.chesstopia.engine.corpus.castlingOf
import io.chesstopia.engine.corpus.positionFrom
import kotlin.test.Test
import kotlin.test.assertEquals

/**
 * Perft: Anzahl der Blattknoten des Zugbaums bis Tiefe n. Die Referenzzahlen
 * stammen aus dem Chess Programming Wiki und sind über Jahrzehnte verifiziert —
 * ein objektives Orakel für die Zugerzeugung (ADR-0019).
 */
class PerftTest {

    private val rules = RuleSet.standard()

    private fun perft(pos: Position, depth: Int): Long {
        if (depth == 0) return 1L
        var nodes = 0L
        for (m in pos.legalMoves(rules)) nodes += perft(pos.play(m), depth - 1)
        return nodes
    }

    @Test fun `Perft der Grundstellung`() {
        // ARRANGE
        val start = standardStartPosition()

        // ACT & ASSERTIONS
        assertEquals(20L, perft(start, 1))
        assertEquals(400L, perft(start, 2))
        assertEquals(8_902L, perft(start, 3))
        assertEquals(197_281L, perft(start, 4))
    }

    @Test fun `Perft Kiwipete`() {
        // ARRANGE — CPW "Position 2": r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -
        val kiwipete = kiwipetePosition()

        // ACT & ASSERTIONS
        assertEquals(48L, perft(kiwipete, 1))
        assertEquals(2_039L, perft(kiwipete, 2))
        assertEquals(97_862L, perft(kiwipete, 3))
    }

    @Test fun `Perft CPW-Position 3 (Endspiel mit en passant)`() {
        // ARRANGE — CPW "Position 3": 8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -
        val p3 = positionFrom(
            listOf(
                "8  . . . . . . . .",
                "7  . . p . . . . .",
                "6  . . . p . . . .",
                "5  K P . . . . . r",
                "4  . R . . . p . k",
                "3  . . . . . . . .",
                "2  . . . . P . P .",
                "1  . . . . . . . .",
            ),
            side = Color.WHITE, castling = castlingOf("-"), ep = null, hm = 0, fm = 1,
        )

        // ACT & ASSERTIONS
        assertEquals(14L, perft(p3, 1))
        assertEquals(191L, perft(p3, 2))
        assertEquals(2_812L, perft(p3, 3))
        assertEquals(43_238L, perft(p3, 4))
    }

    private fun kiwipetePosition(): Position = positionFrom(
        listOf(
            "8  r . . . k . . r",
            "7  p . p p q p b .",
            "6  b n . . p n p .",
            "5  . . . P N . . .",
            "4  . p . . P . . .",
            "3  . . N . . Q . p",
            "2  P P P B B P P P",
            "1  R . . . K . . R",
        ),
        side = Color.WHITE, castling = castlingOf("KQkq"), ep = null, hm = 0, fm = 1,
    )
}

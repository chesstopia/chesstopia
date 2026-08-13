package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Ebene 1 (ADR-0019) für Legalität: Gangart, Fesselung, Schach, Matt, Patt,
 * 50-Züge-Regel und SAN. Perft ist das objektive Orakel, das ADR-0019 für die
 * Engine ankündigt, sobald [getLegalMoves] Züge erzeugt (ADR-0016).
 */
class LegalMovesTest {

    private val initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    private val rules = RuleSet.standard()

    private fun perft(fen: String, depth: Int): Long {
        if (depth == 0) return 1
        val moves = getLegalMoves(fen, rules).moves
        if (depth == 1) return moves.size.toLong()
        var nodes = 0L
        for (move in moves) {
            nodes += perft(applyMove(fen, move.uci, rules), depth - 1)
        }
        return nodes
    }

    // ── Perft ────────────────────────────────────────────────────────────────
    // Bekannte Zugbaumzählungen für die Startstellung, siehe
    // https://www.chessprogramming.org/Perft_Results

    @Test
    fun `perft Tiefe 1 von der Startstellung liefert 20 Zuege`() {
        assertEquals(20L, perft(initialFen, 1))
    }

    @Test
    fun `perft Tiefe 2 von der Startstellung liefert 400 Zuege`() {
        assertEquals(400L, perft(initialFen, 2))
    }

    @Test
    fun `perft Tiefe 3 von der Startstellung liefert 8902 Zuege`() {
        assertEquals(8902L, perft(initialFen, 3))
    }

    // ── Schach, Matt, Patt ───────────────────────────────────────────────────

    @Test
    fun `Fools Mate ist Schachmatt`() {
        val fen = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3"
        val result = getLegalMoves(fen, rules)
        assertTrue(result.isCheck)
        assertTrue(result.isCheckmate)
        assertEquals(0, result.moves.size)
    }

    @Test
    fun `bekannte Stellung ist Patt`() {
        val fen = "7k/5K2/6Q1/8/8/8/8/8 b - - 0 1"
        val result = getLegalMoves(fen, rules)
        assertFalse(result.isCheck)
        assertTrue(result.isStalemate)
        assertEquals(0, result.moves.size)
    }

    // ── Fesselung ────────────────────────────────────────────────────────────

    @Test
    fun `eine gefesselte Figur darf die Linie zum eigenen Koenig nicht verlassen`() {
        val fen = "4k3/8/8/4n3/8/8/8/4R2K b - - 0 1"
        val result = getLegalMoves(fen, rules)
        assertTrue(result.moves.none { it.from == "e5" })
    }

    // ── En passant deckt den eigenen König auf ──────────────────────────────

    @Test
    fun `en passant darf den eigenen Koenig nicht der Reihe nach aufdecken`() {
        val fen = "7k/8/8/r1pP1K2/8/8/8/8 w - c6 0 1"
        val result = getLegalMoves(fen, rules)
        assertTrue(result.moves.none { it.from == "d5" && it.to == "c6" })
    }

    // ── Rochade ──────────────────────────────────────────────────────────────

    @Test
    fun `Rochade ist verboten wenn der Koenig im Schach steht`() {
        val fen = "4r2k/8/8/8/8/8/8/R3K2R w KQ - 0 1"
        val result = getLegalMoves(fen, rules)
        assertTrue(result.moves.none { it.san.startsWith("O-O") })
    }

    @Test
    fun `Rochade ist verboten wenn der Koenig ueber ein angegriffenes Feld zieht`() {
        val fen = "5rk1/8/8/8/8/8/8/R3K2R w KQ - 0 1"
        val result = getLegalMoves(fen, rules)
        assertTrue(result.moves.none { it.san == "O-O" })
        assertTrue(result.moves.any { it.san == "O-O-O" })
    }

    @Test
    fun `Rochade ist verboten wenn ein Zwischenfeld besetzt ist`() {
        val fen = "3k4/8/8/8/8/8/8/R3KB1R w KQ - 0 1"
        val result = getLegalMoves(fen, rules)
        assertTrue(result.moves.none { it.san == "O-O" })
    }

    @Test
    fun `Rochadenotation ist O-O beziehungsweise O-O-O`() {
        val fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"
        val result = getLegalMoves(fen, rules)
        assertTrue(result.moves.any { it.uci == "e1g1" && it.san == "O-O" })
        assertTrue(result.moves.any { it.uci == "e1c1" && it.san == "O-O-O" })
    }

    // ── Unterverwandlung ─────────────────────────────────────────────────────

    @Test
    fun `Unterverwandlung erscheint in der Zugliste`() {
        val fen = "k7/4P3/8/8/8/8/8/4K3 w - - 0 1"
        val result = getLegalMoves(fen, rules)
        val promotions = result.moves.filter { it.from == "e7" && it.to == "e8" }.map { it.promotion }
        assertEquals(setOf("q", "r", "b", "n"), promotions.toSet())
    }

    // ── 50-Züge-Regel ────────────────────────────────────────────────────────

    @Test
    fun `isFiftyMoveDraw ab Halbzugzaehler 100`() {
        assertTrue(getLegalMoves("4k3/8/8/8/8/8/8/4K3 w - - 100 60", rules).isFiftyMoveDraw)
        assertFalse(getLegalMoves("4k3/8/8/8/8/8/8/4K3 w - - 99 60", rules).isFiftyMoveDraw)
    }

    // ── SAN ──────────────────────────────────────────────────────────────────

    @Test
    fun `SAN disambiguiert nach Feld wenn Kandidaten auf unterschiedlichen Linien stehen`() {
        val fen = "4k3/8/8/8/8/2N3N1/8/4K3 w - - 0 1"
        val result = getLegalMoves(fen, rules)
        val toE4 = result.moves.filter { it.to == "e4" && it.from in setOf("c3", "g3") }
        assertEquals(setOf("Nce4", "Nge4"), toE4.map { it.san }.toSet())
    }

    @Test
    fun `SAN disambiguiert nach Reihe wenn Kandidaten auf derselben Linie stehen`() {
        val fen = "R7/8/8/7k/8/8/8/R3K3 w - - 0 1"
        val result = getLegalMoves(fen, rules)
        val toA4 = result.moves.filter { it.to == "a4" && it.from in setOf("a1", "a8") }
        assertEquals(setOf("R1a4", "R8a4"), toA4.map { it.san }.toSet())
    }

    @Test
    fun `SAN disambiguiert nach Feld und Reihe wenn beides mehrfach vorkommt`() {
        // a1 und a5 teilen sich die a-Linie, a1 und c1 die erste Reihe — nur bei
        // a1 reicht weder Feld noch Reihe allein, a5 und c1 kommen mit der
        // jeweils kürzeren Disambiguierung aus (Standard-SAN: minimal, nicht maximal).
        val fen = "4k3/8/8/N7/8/8/8/N1N1K3 w - - 0 1"
        val result = getLegalMoves(fen, rules)
        val toB3 = result.moves.filter { it.to == "b3" }
        assertEquals(setOf("Na1b3", "N5b3", "Ncb3"), toB3.map { it.san }.toSet())
    }

    @Test
    fun `SAN traegt ein Schach-Suffix wenn der Zug Schach bietet`() {
        val fen = "4k3/8/8/8/R7/8/8/7K w - - 0 1"
        val result = getLegalMoves(fen, rules)
        val move = result.moves.single { it.from == "a4" && it.to == "e4" }
        assertEquals("Re4+", move.san)
    }

    @Test
    fun `SAN traegt ein Matt-Suffix bei Fools Mate`() {
        val fen = "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2"
        val result = getLegalMoves(fen, rules)
        val mate = result.moves.single { it.from == "d8" && it.to == "h4" }
        assertEquals("Qh4#", mate.san)
    }
}

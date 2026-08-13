package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Ebene 1 (ADR-0019) für die Zugmechanik.
 *
 * Der Katalog folgt den Stellen, an denen ein naives „Figur von A nach B" still
 * falsch wird: die vier FEN-Felder neben dem Brett. Legalität selbst — Gangart,
 * Fesselung, Schach — deckt [LegalMovesTest] ab, mit Perft als Orakel.
 */
class ChessEngineTest {

    private val initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    private val rules = RuleSet.standard()

    private fun apply(fen: String, uci: String) = applyMove(fen, uci, rules)

    // ── Brett ────────────────────────────────────────────────────────────────

    @Test
    fun `ein Bauernzug versetzt die Figur`() {
        assertEquals(
            "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
            apply(initialFen, "e2e4"),
        )
    }

    @Test
    fun `ein Doppelschritt setzt das En-passant-Ziel, ein Einzelschritt nicht`() {
        assertTrue(apply(initialFen, "e2e4").contains(" e3 "))
        assertTrue(apply(initialFen, "e2e3").contains(" - "))
    }

    @Test
    fun `en passant entfernt den Bauern hinter dem Zielfeld`() {
        // Der Zweig, den man beim ersten Bauen vergisst: Das Zielfeld ist leer,
        // der geschlagene Bauer steht daneben und bliebe sonst stehen.
        assertEquals(
            "k7/8/3P4/8/8/8/8/K7 b - - 0 2",
            apply("k7/8/8/3pP3/8/8/8/K7 w - d6 0 2", "e5d6"),
        )
    }

    @Test
    fun `ein Bauer wandelt in die gewaehlte Figur um`() {
        assertEquals("k3Q3/8/8/8/8/8/8/K7 b - - 0 1", apply("k7/4P3/8/8/8/8/8/K7 w - - 0 1", "e7e8q"))
        assertEquals("k7/8/8/8/8/8/8/K3n3 w - - 0 6", apply("k7/8/8/8/8/8/4p3/K7 b - - 0 5", "e2e1n"))
    }

    // ── Rochade ──────────────────────────────────────────────────────────────

    private val castlingFen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"

    @Test
    fun `die kurze Rochade zieht den Turm mit`() {
        assertEquals("r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1", apply(castlingFen, "e1g1"))
    }

    @Test
    fun `die lange Rochade zieht den Turm mit`() {
        assertEquals("r3k2r/8/8/8/8/8/8/2KR3R b kq - 1 1", apply(castlingFen, "e1c1"))
    }

    @Test
    fun `ein Koenigszug nimmt beide Rochaderechte seiner Seite`() {
        assertTrue(apply(castlingFen, "e1e2").contains(" kq "))
    }

    @Test
    fun `ein Turmzug nimmt nur das Recht auf seiner Seite`() {
        assertTrue(apply(castlingFen, "h1h2").contains(" Qkq "))
        assertTrue(apply(castlingFen, "a1a2").contains(" Kkq "))
    }

    @Test
    fun `ein geschlagener Turm nimmt das Recht des Gegners mit`() {
        // Nicht der Zug des Turms, sondern sein Verlust — der Fall, der beim
        // Fortschreiben der Rechte am ehesten fehlt.
        assertEquals("R3k2r/8/8/8/8/8/8/4K2R b Kk - 0 1", apply(castlingFen, "a1a8"))
    }

    @Test
    fun `der Verlust wird auf allen vier Eckfeldern erkannt`() {
        // Ohne diesen Fall bleibt die Hälfte des Zweiges unbelegt: Die
        // Gegenprobe zum Test darüber lief grün, weil nur die schwarze Ecke
        // geprüft war. Vier Ecken, vier Rechte, vier Belege.
        assertTrue(apply(castlingFen, "a1a8").contains(" Kk "))
        assertTrue(apply(castlingFen, "h1h8").contains(" Qq "))
        val blackToMove = "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1"
        assertTrue(apply(blackToMove, "a8a1").contains(" Kk "))
        assertTrue(apply(blackToMove, "h8h1").contains(" Qq "))
    }

    // ── Zähler ───────────────────────────────────────────────────────────────

    @Test
    fun `der Halbzugzaehler steigt bei einem stillen Zug`() {
        val after = apply("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 4 3", "g1f3")
        assertTrue(after.endsWith(" 5 3"))
    }

    @Test
    fun `Schlagen und Bauernzug setzen den Halbzugzaehler zurueck`() {
        assertTrue(apply("k7/8/8/3p4/4P3/8/8/K7 w - - 9 20", "e4d5").endsWith(" 0 20"))
        assertTrue(apply("k7/8/8/8/4P3/8/8/K7 w - - 9 20", "e4e5").endsWith(" 0 20"))
    }

    @Test
    fun `die Vollzugnummer steigt erst nach dem Zug von Schwarz`() {
        val afterWhite = apply(initialFen, "e2e4")
        assertTrue(afterWhite.endsWith(" 0 1"))
        assertTrue(apply(afterWhite, "e7e5").endsWith(" 0 2"))
    }

    // ── validateMove ─────────────────────────────────────────────────────────

    @Test
    fun `validateMove nimmt einen legalen Zug an`() {
        assertTrue(validateMove(initialFen, "e2e4", rules))
    }

    @Test
    fun `validateMove lehnt einen mechanisch moeglichen, aber unschachlichen Zug ab`() {
        // Der Turm auf a1 könnte "mechanisch" bis a8 ziehen — der eigene Bauer
        // auf a2 versperrt den Weg. Das ist der Fall, den Verbot 3 verlangt.
        assertFalse(validateMove(initialFen, "a1a8", rules))
    }

    @Test
    fun `validateMove lehnt den Zug der falschen Seite ab`() {
        assertFalse(validateMove(initialFen, "e7e5", rules))
    }

    @Test
    fun `validateMove lehnt ein leeres Startfeld ab`() {
        assertFalse(validateMove(initialFen, "e3e4", rules))
    }

    @Test
    fun `validateMove lehnt das Schlagen der eigenen Figur ab`() {
        assertFalse(validateMove(initialFen, "a1a2", rules))
    }

    @Test
    fun `validateMove lehnt kaputte Notation ab, statt zu werfen`() {
        assertFalse(validateMove(initialFen, "e2", rules))
        assertFalse(validateMove(initialFen, "z9e4", rules))
        assertFalse(validateMove(initialFen, "e2e4x", rules))
        assertFalse(validateMove(initialFen, "e2e2", rules))
    }

    @Test
    fun `validateMove verlangt eine Zielfigur bei der Umwandlung`() {
        assertFalse(validateMove("k7/4P3/8/8/8/8/8/K7 w - - 0 1", "e7e8", rules))
        assertTrue(validateMove("k7/4P3/8/8/8/8/8/K7 w - - 0 1", "e7e8q", rules))
    }

    @Test
    fun `applyMove wirft bei einem mechanisch unmoeglichen Zug`() {
        assertFailsWith<IllegalArgumentException> { apply(initialFen, "e7e5") }
        assertFailsWith<IllegalArgumentException> { apply(initialFen, "quatsch") }
    }

    @Test
    fun `applyMove wirft bei kaputter FEN`() {
        assertFailsWith<IllegalArgumentException> { apply("nicht mal fast eine fen", "e2e4") }
    }

    @Test
    fun `RuleSet standard() has expected defaults`() {
        val rs = RuleSet.standard()
        assertEquals(Variant.STANDARD, rs.variant)
        assertTrue(rs.enPassantEnabled)
        assertTrue(rs.castlingEnabled)
    }
}

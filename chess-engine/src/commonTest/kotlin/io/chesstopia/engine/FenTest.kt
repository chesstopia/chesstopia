package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Ebene 1 (ADR-0019) für die Zerlegung der FEN.
 *
 * Der Rundlauf ist der Kern: Was hineingeht, muss unverändert herauskommen.
 * Ein Parser, der still etwas wegwirft, fällt sonst erst Züge später auf —
 * dann als „die Rochade ist verschwunden" und nicht als „das Feld wurde nie gelesen".
 */
class FenTest {

    private val start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

    @Test
    fun `Rundlauf erhaelt die Startstellung`() {
        assertEquals(start, parseFen(start).toFen())
    }

    @Test
    fun `Rundlauf erhaelt eine Mittelspielstellung mit En-passant-Ziel`() {
        val fen = "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq c3 3 5"
        assertEquals(fen, parseFen(fen).toFen())
    }

    @Test
    fun `Rundlauf erhaelt eine Endspielstellung ohne Rochaderechte`() {
        val fen = "8/5k2/8/8/3K4/8/6P1/8 w - - 12 48"
        assertEquals(fen, parseFen(fen).toFen())
    }

    @Test
    fun `Felder werden in FEN-Leserichtung indiziert`() {
        // a8 ist das erste Zeichen einer FEN, h1 das letzte — sonst steht das
        // Brett beim ersten Zug auf dem Kopf.
        assertEquals(0, squareToIndex("a8"))
        assertEquals(63, squareToIndex("h1"))
        assertEquals(52, squareToIndex("e2"))
        assertEquals("e2", indexToSquare(52))
        assertEquals("a8", indexToSquare(0))
    }

    @Test
    fun `die Startstellung besetzt genau 32 Felder`() {
        val position = parseFen(start)
        assertEquals(32, position.squares.count { it != null })
        assertEquals('r', position.squares[squareToIndex("a8")])
        assertEquals('K', position.squares[squareToIndex("e1")])
        assertNull(position.squares[squareToIndex("e4")])
    }

    @Test
    fun `die sechs Felder werden gelesen und nicht geraten`() {
        val position = parseFen("8/8/8/8/8/8/8/8 b Kq e6 7 42")
        assertTrue(!position.whiteToMove)
        assertEquals("Kq", position.castling)
        assertEquals("e6", position.enPassant)
        assertEquals(7, position.halfmoveClock)
        assertEquals(42, position.fullmoveNumber)
    }

    @Test
    fun `eine zu kurze Reihe wird abgelehnt`() {
        // Genau der Fehler, den ein nachsichtiger Parser durchwinkt und der
        // danach als verschwundene Figur auftaucht.
        assertFailsWith<IllegalArgumentException> {
            parseFen("rnbqkbn/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
        }
    }

    @Test
    fun `eine FEN mit fehlenden Feldern wird abgelehnt`() {
        assertFailsWith<IllegalArgumentException> { parseFen("8/8/8/8/8/8/8/8 w - -") }
    }

    @Test
    fun `ein unbekanntes Figurensymbol wird abgelehnt`() {
        assertFailsWith<IllegalArgumentException> {
            parseFen("xnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
        }
    }
}

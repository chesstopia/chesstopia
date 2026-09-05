package io.chesstopia.engine.corpus

import io.chesstopia.engine.*
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class CorpusParserTest {

    private val legalRaw = """
        description = Bauer e2 zieht doppelt
        ruleset     = standard
        move        = e2 e4
        legal       = true

             INITIAL                        EXPECTED
          8  . . . . k . . .             8  . . . . k . . .
          7  . . . . . . . .             7  . . . . . . . .
          6  . . . . . . . .             6  . . . . . . . .
          5  . . . . . . . .             5  . . . . . . . .
          4  . . . . . . . .             4  . . . . P . . .
          3  . . . . . . . .             3  . . . . . . . .
          2  . . . . P . . .             2  . . . . . . . .
          1  . . . . K . . .             1  . . . . K . . .
             a b c d e f g h                a b c d e f g h
          side=white castling=- ep=- hm=0 fm=1             side=black castling=- ep=e3 hm=0 fm=1

        check=false checkmate=false stalemate=false
    """.trimIndent()

    private val illegalRaw = """
        description = Turm springt über eine Figur
        move        = a1 a8
        legal       = false
        reason      = gangart

             INITIAL
          8  . . . . k . . .
          7  . . . . . . . .
          6  . . . . . . . .
          5  . . . . . . . .
          4  . . . . . . . .
          3  . . . . . . . .
          2  R . . . . . . .
          1  R . . . K . . .
             a b c d e f g h
          side=white castling=- ep=- hm=0 fm=1
    """.trimIndent()

    @Test fun `parst einen legalen Fall inklusive Ergebnisstellung und En-passant-Ziel`() {
        // ACT
        val c = CorpusParser.parse(legalRaw)

        // ASSERTIONS
        assertEquals(Move(Square(File.E, Rank.TWO), Square(File.E, Rank.FOUR)), c.move)
        assertTrue(c.expectLegal)
        assertEquals(Color.WHITE, c.initial.sideToMove)
        assertEquals(Square(File.E, Rank.THREE), c.expected!!.enPassantTarget)
        assertEquals(Color.BLACK, c.expected.sideToMove)
    }

    @Test fun `parst einen illegalen Fall ohne Ergebnisstellung, mit Grund`() {
        // ACT
        val c = CorpusParser.parse(illegalRaw)

        // ASSERTIONS
        assertTrue(!c.expectLegal)
        assertEquals("gangart", c.reason)
        assertNull(c.expected)
    }

    @Test fun `liest die RuleSet-Toggles und die Umwandlungsfigur`() {
        // ARRANGE
        val raw = legalRaw
            .replace("ruleset     = standard", "ruleset     = standard no-castling")
            .replace("move        = e2 e4", "move        = e2 e4=Q")

        // ACT
        val c = CorpusParser.parse(raw)

        // ASSERTIONS
        assertTrue(!c.ruleSet.castlingEnabled)
        assertEquals(PieceType.QUEEN, c.move.promotion)
    }
}

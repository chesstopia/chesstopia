package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ChessEngineTest {

    private val rules = RuleSet.standard()
    private val start = standardStartPosition()
    private val e2e4 = Move(sq(File.E, Rank.TWO), sq(File.E, Rank.FOUR))

    @Test fun `initialPosition liefert die Grundstellung`() {
        // ACT & ASSERTIONS
        assertEquals(standardStartPosition(), initialPosition(rules))
    }

    @Test fun `getLegalMoves bleibt bis zur Implementierung nicht verfuegbar`() {
        // ACT & ASSERTIONS
        assertFailsWith<NotImplementedError> { getLegalMoves(start, rules) }
    }

    @Test fun `validateMove nimmt einen legalen Zug an und lehnt einen unschachlichen ab`() {
        // ACT & ASSERTIONS
        assertTrue(validateMove(start, e2e4, rules))
        assertFalse(validateMove(start, Move(sq(File.A, Rank.ONE), sq(File.A, Rank.EIGHT)), rules)) // Turm springt
        assertFalse(validateMove(start, Move(sq(File.E, Rank.SEVEN), sq(File.E, Rank.FIVE)), rules)) // falsche Seite
    }

    @Test fun `applyMove wirft mit sprechendem Grund bei einem illegalen Zug`() {
        // ACT & ASSERTIONS
        val ex = assertFailsWith<IllegalArgumentException> {
            applyMove(start, Move(sq(File.A, Rank.ONE), sq(File.A, Rank.EIGHT)), rules)
        }
        assertTrue(ex.message!!.isNotBlank())
    }

    @Test fun `applyMove fuehrt den legalen Zug aus`() {
        // ACT
        val after = applyMove(start, e2e4, rules)

        // ASSERTIONS
        assertEquals(Piece(PieceType.PAWN, Color.WHITE), after.pieceAt(sq(File.E, Rank.FOUR)))
    }

    @Test fun `gameOutcome erkennt das Schachmatt und nennt den Sieger`() {
        // ARRANGE — Grundreihenmatt: schwarzer König g8 hinter eigenen Bauern, weißer Turm a8 gibt Schach
        val mate = position(
            sq(File.A, Rank.EIGHT) to Piece(PieceType.ROOK, Color.WHITE),
            sq(File.G, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.G, Rank.EIGHT) to Piece(PieceType.KING, Color.BLACK),
            sq(File.F, Rank.SEVEN) to Piece(PieceType.PAWN, Color.BLACK),
            sq(File.G, Rank.SEVEN) to Piece(PieceType.PAWN, Color.BLACK),
            sq(File.H, Rank.SEVEN) to Piece(PieceType.PAWN, Color.BLACK),
            sideToMove = Color.BLACK,
        )

        // ACT
        val outcome = gameOutcome(arrayOf(mate), rules)

        // ASSERTIONS
        assertEquals(OutcomeKind.CHECKMATE, outcome.kind)
        assertEquals(Color.WHITE, outcome.winner)
    }

    @Test fun `gameOutcome erkennt das Patt`() {
        // ARRANGE — schwarzer König a8, weiße Dame b6, weißer König a6; Schwarz am Zug, kein legaler Zug, kein Schach
        val stalemate = position(
            sq(File.A, Rank.EIGHT) to Piece(PieceType.KING, Color.BLACK),
            sq(File.B, Rank.SIX) to Piece(PieceType.QUEEN, Color.WHITE),
            sq(File.A, Rank.SIX) to Piece(PieceType.KING, Color.WHITE),
            sideToMove = Color.BLACK,
        )

        // ACT & ASSERTIONS
        assertEquals(OutcomeKind.STALEMATE, gameOutcome(arrayOf(stalemate), rules).kind)
    }

    @Test fun `gameOutcome meldet IN_PROGRESS fuer die Grundstellung`() {
        // ACT & ASSERTIONS
        assertEquals(OutcomeKind.IN_PROGRESS, gameOutcome(arrayOf(start), rules).kind)
    }

    @Test fun `RuleSet standard hat die erwarteten Vorgaben`() {
        // ACT
        val rs = RuleSet.standard()

        // ASSERTIONS
        assertEquals(Variant.STANDARD, rs.variant)
        assertTrue(rs.enPassantEnabled)
        assertTrue(rs.castlingEnabled)
    }
}

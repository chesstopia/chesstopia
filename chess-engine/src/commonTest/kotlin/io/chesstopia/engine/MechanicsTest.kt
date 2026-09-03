package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

/** Ebene 1 (ADR-0019) für die Zugmechanik — Legalität ist ausdrücklich NICHT Gegenstand (CHESS-2). */
class MechanicsTest {

    private val start = standardStartPosition()

    @Test fun `ein Bauernzug versetzt die Figur`() {
        // ACT
        val after = start.play(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.FOUR)))

        // ASSERTIONS
        assertNull(after.pieceAt(sq(File.E, Rank.TWO)))
        assertEquals(Piece(PieceType.PAWN, Color.WHITE), after.pieceAt(sq(File.E, Rank.FOUR)))
        assertEquals(Color.BLACK, after.sideToMove)
    }

    @Test fun `ein Doppelschritt setzt das En-passant-Ziel, ein Einzelschritt nicht`() {
        // ACT & ASSERTIONS
        assertEquals(sq(File.E, Rank.THREE),
            start.play(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.FOUR))).enPassantTarget)
        assertNull(start.play(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.THREE))).enPassantTarget)
    }

    @Test fun `en passant entfernt den Bauern hinter dem Zielfeld`() {
        // ARRANGE
        val p = position(
            sq(File.E, Rank.FIVE) to Piece(PieceType.PAWN, Color.WHITE),
            sq(File.D, Rank.FIVE) to Piece(PieceType.PAWN, Color.BLACK),
            enPassantTarget = sq(File.D, Rank.SIX), fullmoveNumber = 2,
        )

        // ACT
        val after = p.play(Move(sq(File.E, Rank.FIVE), sq(File.D, Rank.SIX)))

        // ASSERTIONS
        assertNull(after.pieceAt(sq(File.D, Rank.FIVE)))
        assertEquals(Piece(PieceType.PAWN, Color.WHITE), after.pieceAt(sq(File.D, Rank.SIX)))
    }

    @Test fun `ein Bauer wandelt in die gewaehlte Figur um`() {
        // ARRANGE
        val p = position(sq(File.E, Rank.SEVEN) to Piece(PieceType.PAWN, Color.WHITE))

        // ACT
        val after = p.play(Move(sq(File.E, Rank.SEVEN), sq(File.E, Rank.EIGHT), PieceType.QUEEN))

        // ASSERTIONS
        assertEquals(Piece(PieceType.QUEEN, Color.WHITE), after.pieceAt(sq(File.E, Rank.EIGHT)))
    }

    @Test fun `die kurze Rochade zieht den Turm mit und nimmt beide Rechte`() {
        // ARRANGE
        val p = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.H, Rank.ONE) to Piece(PieceType.ROOK, Color.WHITE),
            castlingRights = CastlingRights.ALL,
        )

        // ACT
        val after = p.play(Move(sq(File.E, Rank.ONE), sq(File.G, Rank.ONE)))

        // ASSERTIONS
        assertEquals(Piece(PieceType.KING, Color.WHITE), after.pieceAt(sq(File.G, Rank.ONE)))
        assertEquals(Piece(PieceType.ROOK, Color.WHITE), after.pieceAt(sq(File.F, Rank.ONE)))
        assertEquals(CastlingRights(false, false, true, true), after.castlingRights)
    }

    @Test fun `ein geschlagener Turm nimmt das Rochaderecht des Gegners`() {
        // ARRANGE
        val p = position(
            sq(File.A, Rank.ONE) to Piece(PieceType.ROOK, Color.WHITE),
            sq(File.A, Rank.EIGHT) to Piece(PieceType.ROOK, Color.BLACK),
            castlingRights = CastlingRights.ALL,
        )

        // ACT
        val after = p.play(Move(sq(File.A, Rank.ONE), sq(File.A, Rank.EIGHT)))

        // ASSERTIONS
        assertEquals(CastlingRights(true, false, true, false), after.castlingRights)
    }

    @Test fun `rejectReason lehnt falsche Seite, leeres Feld, eigene Figur ab`() {
        // ACT & ASSERTIONS
        assertTrue(start.rejectReason(Move(sq(File.E, Rank.SEVEN), sq(File.E, Rank.FIVE))) != null)
        assertTrue(start.rejectReason(Move(sq(File.E, Rank.THREE), sq(File.E, Rank.FOUR))) != null)
        assertTrue(start.rejectReason(Move(sq(File.A, Rank.ONE), sq(File.A, Rank.TWO))) != null)
        assertNull(start.rejectReason(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.FOUR))))
    }

    @Test fun `der Halbzugzaehler steigt bei einem Springerzug und nullt bei einem Bauernzug`() {
        // ACT & ASSERTIONS
        val afterKnight = start.play(Move(sq(File.G, Rank.ONE), sq(File.F, Rank.THREE)))
        assertEquals(1, afterKnight.halfmoveClock)
        assertEquals(0, start.play(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.FOUR))).halfmoveClock)
    }

    @Test fun `die Vollzugnummer steigt nach dem Zug von Schwarz`() {
        // ACT & ASSERTIONS
        val afterWhite = start.play(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.FOUR)))
        assertEquals(1, afterWhite.fullmoveNumber)
        assertEquals(2, afterWhite.play(Move(sq(File.E, Rank.SEVEN), sq(File.E, Rank.FIVE))).fullmoveNumber)
    }

    @Test fun `die lange Rochade zieht den Turm mit und nimmt beide weissen Rechte`() {
        // ARRANGE
        val p = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.A, Rank.ONE) to Piece(PieceType.ROOK, Color.WHITE),
            castlingRights = CastlingRights.ALL,
        )

        // ACT
        val after = p.play(Move(sq(File.E, Rank.ONE), sq(File.C, Rank.ONE)))

        // ASSERTIONS
        assertEquals(Piece(PieceType.KING, Color.WHITE), after.pieceAt(sq(File.C, Rank.ONE)))
        assertEquals(Piece(PieceType.ROOK, Color.WHITE), after.pieceAt(sq(File.D, Rank.ONE)))
        assertEquals(CastlingRights(false, false, true, true), after.castlingRights)
    }

    @Test fun `ein Koenigsfluegel-Turmzug loescht nur das Koenigsfluegel-Recht, auf beiden Farben`() {
        // ARRANGE
        val men = arrayOf(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.A, Rank.ONE) to Piece(PieceType.ROOK, Color.WHITE),
            sq(File.H, Rank.ONE) to Piece(PieceType.ROOK, Color.WHITE),
            sq(File.E, Rank.EIGHT) to Piece(PieceType.KING, Color.BLACK),
            sq(File.A, Rank.EIGHT) to Piece(PieceType.ROOK, Color.BLACK),
            sq(File.H, Rank.EIGHT) to Piece(PieceType.ROOK, Color.BLACK),
        )
        val whiteToMove = position(*men, sideToMove = Color.WHITE, castlingRights = CastlingRights.ALL)
        val blackToMove = position(*men, sideToMove = Color.BLACK, castlingRights = CastlingRights.ALL)

        // ACT & ASSERTIONS
        assertEquals(
            CastlingRights(false, true, true, true),
            whiteToMove.play(Move(sq(File.H, Rank.ONE), sq(File.H, Rank.TWO))).castlingRights,
        )
        assertEquals(
            CastlingRights(true, true, false, true),
            blackToMove.play(Move(sq(File.H, Rank.EIGHT), sq(File.H, Rank.TWO))).castlingRights,
        )
    }

    @Test fun `der Halbzugzaehler nullt bei einem Schlag`() {
        // ARRANGE
        val p = position(
            sq(File.A, Rank.ONE) to Piece(PieceType.ROOK, Color.WHITE),
            sq(File.A, Rank.EIGHT) to Piece(PieceType.ROOK, Color.BLACK),
            halfmoveClock = 5,
        )

        // ACT
        val after = p.play(Move(sq(File.A, Rank.ONE), sq(File.A, Rank.EIGHT)))

        // ASSERTIONS
        assertEquals(0, after.halfmoveClock)
    }
}

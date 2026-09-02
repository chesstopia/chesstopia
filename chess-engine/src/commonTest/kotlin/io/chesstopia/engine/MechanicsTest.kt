package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

/** Ebene 1 (ADR-0019) für die Zugmechanik — Legalität ist ausdrücklich NICHT Gegenstand (CHESS-2). */
class MechanicsTest {

    private val start = standardStartPosition()
    private fun sq(f: File, r: Rank) = Square(f, r)

    @Test fun `ein Bauernzug versetzt die Figur`() {
        val after = start.play(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.FOUR)))
        assertNull(after.pieceAt(sq(File.E, Rank.TWO)))
        assertEquals(Piece(PieceType.PAWN, Color.WHITE), after.pieceAt(sq(File.E, Rank.FOUR)))
        assertEquals(Color.BLACK, after.sideToMove)
    }

    @Test fun `ein Doppelschritt setzt das En-passant-Ziel, ein Einzelschritt nicht`() {
        assertEquals(sq(File.E, Rank.THREE),
            start.play(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.FOUR))).enPassantTarget)
        assertNull(start.play(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.THREE))).enPassantTarget)
    }

    @Test fun `en passant entfernt den Bauern hinter dem Zielfeld`() {
        val board = arrayOfNulls<Piece>(64)
        board[sq(File.E, Rank.FIVE).boardIndex()] = Piece(PieceType.PAWN, Color.WHITE)
        board[sq(File.D, Rank.FIVE).boardIndex()] = Piece(PieceType.PAWN, Color.BLACK)
        val p = Position(board, Color.WHITE, CastlingRights.NONE, sq(File.D, Rank.SIX), 0, 2)
        val after = p.play(Move(sq(File.E, Rank.FIVE), sq(File.D, Rank.SIX)))
        assertNull(after.pieceAt(sq(File.D, Rank.FIVE)))
        assertEquals(Piece(PieceType.PAWN, Color.WHITE), after.pieceAt(sq(File.D, Rank.SIX)))
    }

    @Test fun `ein Bauer wandelt in die gewaehlte Figur um`() {
        val board = arrayOfNulls<Piece>(64)
        board[sq(File.E, Rank.SEVEN).boardIndex()] = Piece(PieceType.PAWN, Color.WHITE)
        val p = Position(board, Color.WHITE, CastlingRights.NONE, null, 0, 1)
        val after = p.play(Move(sq(File.E, Rank.SEVEN), sq(File.E, Rank.EIGHT), PieceType.QUEEN))
        assertEquals(Piece(PieceType.QUEEN, Color.WHITE), after.pieceAt(sq(File.E, Rank.EIGHT)))
    }

    @Test fun `die kurze Rochade zieht den Turm mit und nimmt beide Rechte`() {
        val board = arrayOfNulls<Piece>(64)
        board[sq(File.E, Rank.ONE).boardIndex()] = Piece(PieceType.KING, Color.WHITE)
        board[sq(File.H, Rank.ONE).boardIndex()] = Piece(PieceType.ROOK, Color.WHITE)
        val p = Position(board, Color.WHITE, CastlingRights.ALL, null, 0, 1)
        val after = p.play(Move(sq(File.E, Rank.ONE), sq(File.G, Rank.ONE)))
        assertEquals(Piece(PieceType.KING, Color.WHITE), after.pieceAt(sq(File.G, Rank.ONE)))
        assertEquals(Piece(PieceType.ROOK, Color.WHITE), after.pieceAt(sq(File.F, Rank.ONE)))
        assertEquals(CastlingRights(false, false, true, true), after.castlingRights)
    }

    @Test fun `ein geschlagener Turm nimmt das Rochaderecht des Gegners`() {
        val board = arrayOfNulls<Piece>(64)
        board[sq(File.A, Rank.ONE).boardIndex()] = Piece(PieceType.ROOK, Color.WHITE)
        board[sq(File.A, Rank.EIGHT).boardIndex()] = Piece(PieceType.ROOK, Color.BLACK)
        val p = Position(board, Color.WHITE, CastlingRights.ALL, null, 0, 1)
        val after = p.play(Move(sq(File.A, Rank.ONE), sq(File.A, Rank.EIGHT)))
        assertEquals(CastlingRights(true, false, true, false), after.castlingRights)
    }

    @Test fun `rejectReason lehnt falsche Seite, leeres Feld, eigene Figur ab`() {
        assertTrue(start.rejectReason(Move(sq(File.E, Rank.SEVEN), sq(File.E, Rank.FIVE))) != null)
        assertTrue(start.rejectReason(Move(sq(File.E, Rank.THREE), sq(File.E, Rank.FOUR))) != null)
        assertTrue(start.rejectReason(Move(sq(File.A, Rank.ONE), sq(File.A, Rank.TWO))) != null)
        assertNull(start.rejectReason(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.FOUR))))
    }

    @Test fun `der Halbzugzaehler steigt bei einem Springerzug und nullt bei einem Bauernzug`() {
        val afterKnight = start.play(Move(sq(File.G, Rank.ONE), sq(File.F, Rank.THREE)))
        assertEquals(1, afterKnight.halfmoveClock)
        assertEquals(0, start.play(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.FOUR))).halfmoveClock)
    }

    @Test fun `die Vollzugnummer steigt nach dem Zug von Schwarz`() {
        val afterWhite = start.play(Move(sq(File.E, Rank.TWO), sq(File.E, Rank.FOUR)))
        assertEquals(1, afterWhite.fullmoveNumber)
        assertEquals(2, afterWhite.play(Move(sq(File.E, Rank.SEVEN), sq(File.E, Rank.FIVE))).fullmoveNumber)
    }
}

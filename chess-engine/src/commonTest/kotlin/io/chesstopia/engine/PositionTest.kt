package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class PositionTest {

    @Test
    fun `die Startstellung besetzt genau 32 Felder`() {
        // ACT
        val p = standardStartPosition()

        // ASSERTIONS
        assertEquals(32, p.board.size)
        assertEquals(Piece(PieceType.ROOK, Color.BLACK), p.pieceAt(Square(File.A, Rank.EIGHT)))
        assertEquals(Piece(PieceType.KING, Color.WHITE), p.pieceAt(Square(File.E, Rank.ONE)))
        assertNull(p.pieceAt(Square(File.E, Rank.FOUR)))
    }

    @Test
    fun `die Startstellung hat Weiß am Zug, alle Rochaderechte, keinen Halbzug`() {
        // ACT
        val p = standardStartPosition()

        // ASSERTIONS
        assertEquals(Color.WHITE, p.sideToMove)
        assertEquals(CastlingRights.ALL, p.castlingRights)
        assertNull(p.enPassantTarget)
        assertEquals(0, p.halfmoveClock)
        assertEquals(1, p.fullmoveNumber)
    }

    @Test
    fun `zwei gleich aufgebaute Stellungen sind gleich`() {
        // ACT & ASSERTIONS
        assertEquals(standardStartPosition(), standardStartPosition())
    }

    @Test
    fun `die Reihenfolge der Feldliste ändert die Gleichheit nicht`() {
        // ARRANGE
        val a = position(
            Square(File.E, Rank.TWO) to Piece(PieceType.PAWN, Color.WHITE),
            Square(File.D, Rank.FOUR) to Piece(PieceType.KNIGHT, Color.BLACK),
        )
        val b = position(
            Square(File.D, Rank.FOUR) to Piece(PieceType.KNIGHT, Color.BLACK),
            Square(File.E, Rank.TWO) to Piece(PieceType.PAWN, Color.WHITE),
        )

        // ACT & ASSERTIONS
        assertEquals(a, b)
        assertEquals(a.hashCode(), b.hashCode())
    }
}

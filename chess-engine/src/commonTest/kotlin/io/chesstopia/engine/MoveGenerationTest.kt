package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class MoveGenerationTest {

    private val rules = RuleSet.standard()

    @Test fun `die Grundstellung hat 20 pseudo-legale Zuege`() {
        // ACT
        val moves = standardStartPosition().pseudoLegalMoves(rules)

        // ASSERTIONS
        assertEquals(20, moves.size)
    }

    @Test fun `ein Bauer auf der vorletzten Reihe erzeugt vier Umwandlungszuege`() {
        // ARRANGE
        val p = position(sq(File.E, Rank.SEVEN) to Piece(PieceType.PAWN, Color.WHITE))

        // ACT
        val toE8 = p.pseudoLegalMoves(rules).filter { it.to == sq(File.E, Rank.EIGHT) }

        // ASSERTIONS
        assertEquals(
            setOf(PieceType.QUEEN, PieceType.ROOK, PieceType.BISHOP, PieceType.KNIGHT),
            toE8.map { it.promotion }.toSet(),
        )
    }

    @Test fun `en passant wird nur bei passendem Zielfeld und aktiviertem Toggle erzeugt`() {
        // ARRANGE
        val men = arrayOf(
            sq(File.E, Rank.FIVE) to Piece(PieceType.PAWN, Color.WHITE),
            sq(File.D, Rank.FIVE) to Piece(PieceType.PAWN, Color.BLACK),
        )
        val withEp = position(*men, enPassantTarget = sq(File.D, Rank.SIX))
        val noEp = position(*men)

        // ACT & ASSERTIONS
        assertContains(withEp.pseudoLegalMoves(rules), Move(sq(File.E, Rank.FIVE), sq(File.D, Rank.SIX)))
        assertFalse(noEp.pseudoLegalMoves(rules).any { it.to == sq(File.D, Rank.SIX) })
        assertFalse(withEp.pseudoLegalMoves(rules.copy(enPassantEnabled = false))
            .any { it.to == sq(File.D, Rank.SIX) })
    }

    @Test fun `Rochade-Kandidat entsteht nur bei Recht, freien Feldern und stehendem Turm`() {
        // ARRANGE
        val ok = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.H, Rank.ONE) to Piece(PieceType.ROOK, Color.WHITE),
            castlingRights = CastlingRights.ALL,
        )
        val blocked = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.F, Rank.ONE) to Piece(PieceType.BISHOP, Color.WHITE),
            sq(File.H, Rank.ONE) to Piece(PieceType.ROOK, Color.WHITE),
            castlingRights = CastlingRights.ALL,
        )
        val noRight = position(
            sq(File.E, Rank.ONE) to Piece(PieceType.KING, Color.WHITE),
            sq(File.H, Rank.ONE) to Piece(PieceType.ROOK, Color.WHITE),
            castlingRights = CastlingRights.NONE,
        )

        // ACT & ASSERTIONS
        // Prüfe den Rochadezug selbst (Move ab E1), nicht "irgendein Zug nach G1" —
        // ein Turm auf H1 zieht pseudo-legal nach G1 und ist keine Rochade.
        assertTrue(ok.pseudoLegalMoves(rules).contains(Move(sq(File.E, Rank.ONE), sq(File.G, Rank.ONE))))
        assertFalse(blocked.pseudoLegalMoves(rules).contains(Move(sq(File.E, Rank.ONE), sq(File.G, Rank.ONE))))
        assertFalse(noRight.pseudoLegalMoves(rules).contains(Move(sq(File.E, Rank.ONE), sq(File.G, Rank.ONE))))
    }

    @Test fun `ein Laeufer stoppt an der eigenen Figur und schlaegt die gegnerische`() {
        // ARRANGE
        val p = position(
            sq(File.C, Rank.ONE) to Piece(PieceType.BISHOP, Color.WHITE),
            sq(File.E, Rank.THREE) to Piece(PieceType.PAWN, Color.WHITE),
            sq(File.A, Rank.THREE) to Piece(PieceType.PAWN, Color.BLACK),
        )

        // ACT
        val fromC1 = p.pseudoLegalMoves(rules).filter { it.from == sq(File.C, Rank.ONE) }.map { it.to }.toSet()

        // ASSERTIONS
        assertTrue(sq(File.D, Rank.TWO) in fromC1)
        assertTrue(sq(File.B, Rank.TWO) in fromC1)
        assertTrue(sq(File.A, Rank.THREE) in fromC1)   // Schlag
        assertFalse(sq(File.E, Rank.THREE) in fromC1)  // eigene Figur
        assertFalse(sq(File.F, Rank.FOUR) in fromC1)   // dahinter
    }
}

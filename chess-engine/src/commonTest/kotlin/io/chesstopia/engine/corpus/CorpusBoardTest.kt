package io.chesstopia.engine.corpus

import io.chesstopia.engine.*
import kotlin.test.Test
import kotlin.test.assertEquals

class CorpusBoardTest {

    private val startRows = listOf(
        "8  r n b q k b n r",
        "7  p p p p p p p p",
        "6  . . . . . . . .",
        "5  . . . . . . . .",
        "4  . . . . . . . .",
        "3  . . . . . . . .",
        "2  P P P P P P P P",
        "1  R N B Q K B N R",
    )

    @Test fun `parseBoard und renderBoard sind zueinander invers fuer die Grundstellung`() {
        // ACT
        val parsed = positionFrom(startRows, Color.WHITE, CastlingRights.ALL, null, 0, 1)

        // ASSERTIONS
        assertEquals(standardStartPosition(), parsed)
        assertEquals(startRows, renderBoard(parsed))
    }

    @Test fun `castlingOf liest die Rechte, squareOf den Bindestrich`() {
        // ACT & ASSERTIONS
        assertEquals(CastlingRights(true, false, false, true), castlingOf("Kq"))
        assertEquals(CastlingRights.NONE, castlingOf("-"))
        assertEquals(null, squareOf("-"))
        assertEquals(Square(File.D, Rank.SIX), squareOf("d6"))
    }
}

package io.chesstopia.engine

import kotlin.test.Test
import kotlin.test.assertEquals

class VocabularyTest {

    @Test
    fun `boardIndex folgt der FEN-Leserichtung a8 ist 0`() {
        assertEquals(0, Square(File.A, Rank.EIGHT).boardIndex())
        assertEquals(63, Square(File.H, Rank.ONE).boardIndex())
        assertEquals(52, Square(File.E, Rank.TWO).boardIndex())
    }

    @Test
    fun `squareAt ist die Umkehrung von boardIndex`() {
        for (i in 0 until 64) assertEquals(i, squareAt(i).boardIndex())
    }
}

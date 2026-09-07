package io.chesstopia.engine.corpus

import kotlin.test.Test
import kotlin.test.assertFailsWith

class CorpusRunnerTest {

    private fun case(expectedRank4: String) = """
        description = probe
        ruleset     = standard
        move        = e2 e4
        legal       = true

             INITIAL                        EXPECTED
          8  . . . . k . . .             8  . . . . k . . .
          7  . . . . . . . .             7  . . . . . . . .
          6  . . . . . . . .             6  . . . . . . . .
          5  . . . . . . . .             5  . . . . . . . .
          4  . . . . . . . .             4  $expectedRank4
          3  . . . . . . . .             3  . . . . . . . .
          2  . . . . P . . .             2  . . . . . . . .
          1  . . . . K . . .             1  . . . . K . . .
             a b c d e f g h                a b c d e f g h
          side=white castling=- ep=- hm=0 fm=1             side=black castling=- ep=e3 hm=0 fm=1

        check=false checkmate=false stalemate=false
    """.trimIndent()

    @Test fun `laesst einen korrekten Fall durchlaufen`() {
        // ACT & ASSERTIONS  (kein Wurf)
        CorpusRunner.run(case(". . . . P . . ."), "probe/ok.case")
    }

    @Test fun `wirft mit Seitenvergleich, wenn die Ergebnisstellung abweicht`() {
        // ACT & ASSERTIONS
        val err = assertFailsWith<AssertionError> {
            CorpusRunner.run(case(". . . P . . . ."), "probe/mismatch.case")
        }
        kotlin.test.assertTrue(err.message!!.contains("ERWARTET"))
    }
}

package io.chesstopia.engine.corpus

import io.chesstopia.engine.*
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.fail

internal object CorpusRunner {

    fun run(raw: String, name: String) {
        val case = runCatching { CorpusParser.parse(raw) }
            .getOrElse { fail("Testfall '$name' nicht parsebar: ${it.message}") }

        assertEquals(
            case.expectLegal,
            validateMove(case.initial, case.move, case.ruleSet),
            "validateMove('$name') erwartete legal=${case.expectLegal}",
        )

        if (!case.expectLegal) {
            val ex = runCatching { applyMove(case.initial, case.move, case.ruleSet) }.exceptionOrNull()
            assertTrue(ex is IllegalArgumentException, "applyMove('$name') hätte werfen müssen, warf ${ex}")
            case.reason?.let { r ->
                assertTrue(
                    ex!!.message?.contains(r, ignoreCase = true) == true,
                    "Grund('$name') erwartet '$r', war '${ex.message}'",
                )
            }
            return
        }

        val after = applyMove(case.initial, case.move, case.ruleSet)
        if (after != case.expected) {
            fail("Stellung nach '$name' weicht ab:\n\n" + renderSideBySide(case.expected!!, after))
        }
        assertEquals(case.expectCheck, after.isCheck(), "check-Flag('$name')")
        assertEquals(case.expectCheckmate, after.isCheck() && after.legalMoves(case.ruleSet).isEmpty(),
            "checkmate-Flag('$name')")
        assertEquals(case.expectStalemate, !after.isCheck() && after.legalMoves(case.ruleSet).isEmpty(),
            "stalemate-Flag('$name')")
        case.expectedOutcome?.let {
            assertEquals(it, gameOutcome(arrayOf(case.initial, after), case.ruleSet).kind, "outcome('$name')")
        }
    }

    private fun renderSideBySide(expected: Position, actual: Position): String {
        val e = renderBoard(expected)
        val a = renderBoard(actual)
        val body = e.indices.joinToString("\n") { "  ${e[it].padEnd(26)}${a[it]}" }
        return "  ERWARTET".padEnd(28) + "TATSÄCHLICH\n" +
            body + "\n" +
            "  ${metaText(expected).padEnd(26)}${metaText(actual)}"
    }

    private fun metaText(p: Position): String {
        val ep = p.enPassantTarget?.let { it.file.name.lowercase() + (it.rank.ordinal + 1) } ?: "-"
        return "side=${p.sideToMove.name.lowercase()} castling=${castlingText(p.castlingRights)} " +
            "ep=$ep hm=${p.halfmoveClock} fm=${p.fullmoveNumber}"
    }
}

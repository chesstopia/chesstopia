package io.chesstopia.engine.corpus

import io.chesstopia.engine.*

internal object CorpusParser {

    fun parse(raw: String): CorpusCase {
        val lines = raw.replace("\r\n", "\n").split("\n")
        val headerIdx = lines.indexOfFirst { it.trim().startsWith("INITIAL") }
        require(headerIdx >= 0) { "Kein 'INITIAL'-Kopf im Testfall" }
        val twoColumns = lines[headerIdx].contains("EXPECTED")

        val top = mutableMapOf<String, String>()
        for (i in 0 until headerIdx) {
            val t = lines[i].trim()
            if (t.isEmpty() || t.startsWith("#")) continue
            require("=" in t) { "Kopfzeile ohne '=': '$t'" }
            top[t.substringBefore("=").trim().lowercase()] = t.substringAfter("=").trim()
        }

        val expectLegal = when (top["legal"]) {
            "true" -> true
            "false" -> false
            else -> error("Feld 'legal' fehlt oder ist weder true noch false")
        }
        require(expectLegal == twoColumns) {
            "legal=$expectLegal passt nicht zur ${if (twoColumns) "vorhandenen" else "fehlenden"} EXPECTED-Spalte"
        }

        val leftRows = mutableListOf<String>()
        val rightRows = mutableListOf<String>()
        val leftMeta = mutableMapOf<String, String>()
        val rightMeta = mutableMapOf<String, String>()
        val flags = mutableMapOf<String, String>()

        for (i in (headerIdx + 1) until lines.size) {
            val t = lines[i].trim()
            if (t.isEmpty() || t.startsWith("#")) continue
            if (t.startsWith("a ")) continue
            if (t.startsWith("check") || t.startsWith("outcome")) { parseTokens(t, flags); continue }
            val cols = t.split(Regex(" {4,}"))
            val left = cols[0]
            val right = cols.getOrNull(1)
            when {
                left.first().isDigit() -> {
                    leftRows += left
                    right?.let { rightRows += it }
                }
                left.startsWith("side") -> {
                    parseTokens(left, leftMeta)
                    right?.let { parseTokens(it, rightMeta) }
                }
            }
        }

        require(leftRows.size == 8) { "INITIAL hat ${leftRows.size} statt 8 Zeilen" }
        if (twoColumns) require(rightRows.size == 8) { "EXPECTED hat ${rightRows.size} statt 8 Zeilen" }

        val initial = positionFrom(
            leftRows,
            colorOf(leftMeta.getValue("side")), castlingOf(leftMeta.getValue("castling")),
            squareOf(leftMeta.getValue("ep")), leftMeta.getValue("hm").toInt(), leftMeta.getValue("fm").toInt(),
        )
        val expected = if (!twoColumns) null else positionFrom(
            rightRows,
            colorOf(rightMeta.getValue("side")), castlingOf(rightMeta.getValue("castling")),
            squareOf(rightMeta.getValue("ep")), rightMeta.getValue("hm").toInt(), rightMeta.getValue("fm").toInt(),
        )

        return CorpusCase(
            description = top["description"].orEmpty(),
            ruleSet = ruleSetOf(top["ruleset"] ?: "standard"),
            move = moveOf(top.getValue("move")),
            expectLegal = expectLegal,
            reason = top["reason"],
            initial = initial,
            expected = expected,
            expectCheck = flags["check"] == "true",
            expectCheckmate = flags["checkmate"] == "true",
            expectStalemate = flags["stalemate"] == "true",
            expectedOutcome = flags["outcome"]?.let(::outcomeOf),
        )
    }

    private fun parseTokens(s: String, into: MutableMap<String, String>) {
        for (tok in s.trim().split(Regex(" +"))) {
            if ("=" in tok) into[tok.substringBefore("=")] = tok.substringAfter("=")
        }
    }

    private fun colorOf(s: String) = when (s.lowercase()) {
        "white", "w" -> Color.WHITE
        "black", "b" -> Color.BLACK
        else -> error("Seite ist weder white noch black: '$s'")
    }

    private fun ruleSetOf(s: String): RuleSet {
        val base = RuleSet.standard()
        return when (s.lowercase().trim()) {
            "standard" -> base
            "standard no-ep" -> base.copy(enPassantEnabled = false)
            "standard no-castling" -> base.copy(castlingEnabled = false)
            else -> error("Unbekanntes ruleset: '$s'")
        }
    }

    private fun moveOf(s: String): Move {
        val parts = s.trim().split(Regex(" +"))
        require(parts.size == 2) { "move braucht 'from to': '$s'" }
        val from = squareOf(parts[0]) ?: error("from darf nicht '-' sein")
        val hasPromo = "=" in parts[1]
        val toName = if (hasPromo) parts[1].substringBefore("=") else parts[1]
        val to = squareOf(toName) ?: error("to darf nicht '-' sein")
        val promo = if (hasPromo) promotionOf(parts[1].substringAfter("=")) else null
        return Move(from, to, promo)
    }

    private fun promotionOf(s: String) = when (s.uppercase()) {
        "Q" -> PieceType.QUEEN
        "R" -> PieceType.ROOK
        "B" -> PieceType.BISHOP
        "N" -> PieceType.KNIGHT
        else -> error("Umwandlung ist Q/R/B/N, nicht '$s'")
    }

    private fun outcomeOf(s: String) = when (s.lowercase().trim()) {
        "checkmate" -> OutcomeKind.CHECKMATE
        "stalemate" -> OutcomeKind.STALEMATE
        "draw-fifty" -> OutcomeKind.DRAW_FIFTY_MOVE
        "draw-material" -> OutcomeKind.DRAW_INSUFFICIENT_MATERIAL
        "draw-threefold" -> OutcomeKind.DRAW_THREEFOLD_REPETITION
        else -> error("Unbekanntes outcome: '$s'")
    }
}

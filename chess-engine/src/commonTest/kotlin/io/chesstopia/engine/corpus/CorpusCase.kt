package io.chesstopia.engine.corpus

import io.chesstopia.engine.*

internal data class CorpusCase(
    val description: String,
    val ruleSet: RuleSet,
    val move: Move,
    val expectLegal: Boolean,
    val reason: String?,
    val initial: Position,
    val expected: Position?,
    val expectCheck: Boolean,
    val expectCheckmate: Boolean,
    val expectStalemate: Boolean,
    val expectedOutcome: OutcomeKind?,
)

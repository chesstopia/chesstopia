@file:OptIn(ExperimentalJsExport::class)

package io.chesstopia.engine

import kotlin.js.ExperimentalJsExport
import kotlin.js.JsExport

/**
 * Named, well-known chess rule configurations used as the base of a RuleSet.
 * Corresponds to the Variant domain term in CONTEXT.md.
 */
@JsExport
enum class Variant {
    STANDARD,
    CHESS960,
    KING_OF_THE_HILL,
    THREE_CHECK,
    CRAZYHOUSE,
}

/**
 * Configuration object attached to a Partie that defines which chess rules are active.
 * Consists of a base Variant plus optional rule Toggles.
 *
 * Arbitrary scripted or free-form rules are out of scope (see CONTEXT.md: RuleSet).
 */
@JsExport
data class RuleSet(
    val variant: Variant,
    val enPassantEnabled: Boolean,
    val castlingEnabled: Boolean,
) {
    companion object {
        /** Standard FIDE rules — the default for a new Partie. */
        fun standard() = RuleSet(
            variant = Variant.STANDARD,
            enPassantEnabled = true,
            castlingEnabled = true,
        )
    }
}

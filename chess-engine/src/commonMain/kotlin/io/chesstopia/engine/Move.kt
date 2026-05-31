@file:OptIn(ExperimentalJsExport::class)

package io.chesstopia.engine

import kotlin.js.ExperimentalJsExport
import kotlin.js.JsExport

/**
 * A single half-move (ply) within a Partie.
 *
 * @param san  Standard Algebraic Notation, e.g. "Nf3", "O-O", "e8=Q"
 * @param uci  Universal Chess Interface notation, e.g. "g1f3", "e7e8q"
 * @param from Origin square in algebraic notation, e.g. "g1"
 * @param to   Target square in algebraic notation, e.g. "f3"
 * @param promotion Promotion piece symbol if applicable: "q", "r", "b", "n"
 */
@JsExport
data class Move(
    val san: String,
    val uci: String,
    val from: String,
    val to: String,
    val promotion: String? = null,
)

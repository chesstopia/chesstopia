@file:OptIn(ExperimentalJsExport::class)

package io.chesstopia.engine

import kotlin.js.ExperimentalJsExport
import kotlin.js.JsExport

/**
 * Ein Halbzug — Ausgangsfeld, Zielfeld, bei einer Umwandlung die Zielfigur.
 * Keine Notation: `from`/`to` sind Felder, kein "e2e4".
 */
@JsExport
data class Move(val from: Square, val to: Square, val promotion: PieceType? = null)

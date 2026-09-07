package io.chesstopia.engine

internal val KNIGHT_STEPS = listOf(-2 to -1, -2 to 1, -1 to -2, -1 to 2, 1 to -2, 1 to 2, 2 to -1, 2 to 1)
internal val KING_STEPS = listOf(-1 to -1, -1 to 0, -1 to 1, 0 to -1, 0 to 1, 1 to -1, 1 to 0, 1 to 1)
internal val ROOK_DIRS = listOf(-1 to 0, 1 to 0, 0 to -1, 0 to 1)
internal val BISHOP_DIRS = listOf(-1 to -1, -1 to 1, 1 to -1, 1 to 1)

internal fun Color.opposite(): Color = if (this == Color.WHITE) Color.BLACK else Color.WHITE

internal fun square(fileIdx: Int, rankIdx: Int): Square? =
    if (fileIdx in 0..7 && rankIdx in 0..7) Square(File.entries[fileIdx], Rank.entries[rankIdx]) else null

internal fun Position.isAttackedBy(target: Square, attacker: Color): Boolean {
    val pieces = pieceMap()
    val tf = target.file.ordinal
    val tr = target.rank.ordinal

    for ((df, dr) in KNIGHT_STEPS) {
        val p = pieces[square(tf + df, tr + dr) ?: continue] ?: continue
        if (p.color == attacker && p.type == PieceType.KNIGHT) return true
    }
    for ((df, dr) in KING_STEPS) {
        val p = pieces[square(tf + df, tr + dr) ?: continue] ?: continue
        if (p.color == attacker && p.type == PieceType.KING) return true
    }
    // Ein Bauer der Farbe `attacker` steht eine Reihe in seiner Rückrichtung und eine Linie neben `target`.
    val pawnRankOffset = if (attacker == Color.WHITE) -1 else 1
    for (df in listOf(-1, 1)) {
        val p = pieces[square(tf + df, tr + pawnRankOffset) ?: continue] ?: continue
        if (p.color == attacker && p.type == PieceType.PAWN) return true
    }
    for ((df, dr) in ROOK_DIRS) if (rayHits(pieces, tf, tr, df, dr, attacker, PieceType.ROOK)) return true
    for ((df, dr) in BISHOP_DIRS) if (rayHits(pieces, tf, tr, df, dr, attacker, PieceType.BISHOP)) return true
    return false
}

private fun rayHits(
    pieces: Map<Square, Piece>, tf: Int, tr: Int, df: Int, dr: Int, attacker: Color, straight: PieceType,
): Boolean {
    var f = tf + df
    var r = tr + dr
    while (f in 0..7 && r in 0..7) {
        val p = pieces[Square(File.entries[f], Rank.entries[r])]
        if (p != null) return p.color == attacker && (p.type == straight || p.type == PieceType.QUEEN)
        f += df; r += dr
    }
    return false
}

internal fun Position.kingSquare(color: Color): Square =
    pieceMap().entries.firstOrNull { it.value.type == PieceType.KING && it.value.color == color }?.key
        ?: throw IllegalStateException("Kein $color-König auf dem Brett")

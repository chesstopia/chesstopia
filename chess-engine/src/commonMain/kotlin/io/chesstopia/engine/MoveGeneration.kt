package io.chesstopia.engine

internal fun Position.pseudoLegalMoves(ruleSet: RuleSet): List<Move> {
    val pieces = pieceMap()
    val out = mutableListOf<Move>()
    for ((from, piece) in pieces) {
        if (piece.color != sideToMove) continue
        when (piece.type) {
            PieceType.PAWN -> pawnMoves(pieces, from, piece, ruleSet, out)
            PieceType.KNIGHT -> stepMoves(pieces, from, piece, KNIGHT_STEPS, out)
            PieceType.KING -> {
                stepMoves(pieces, from, piece, KING_STEPS, out)
                castlingCandidates(pieces, from, piece, ruleSet, out)
            }
            PieceType.ROOK -> rayMoves(pieces, from, piece, ROOK_DIRS, out)
            PieceType.BISHOP -> rayMoves(pieces, from, piece, BISHOP_DIRS, out)
            PieceType.QUEEN -> rayMoves(pieces, from, piece, ROOK_DIRS + BISHOP_DIRS, out)
        }
    }
    return out
}

private fun Position.pawnMoves(
    pieces: Map<Square, Piece>, from: Square, piece: Piece, ruleSet: RuleSet, out: MutableList<Move>,
) {
    val dir = if (piece.color == Color.WHITE) 1 else -1
    val startRank = if (piece.color == Color.WHITE) Rank.TWO else Rank.SEVEN
    val f = from.file.ordinal
    val r = from.rank.ordinal
    val oneR = r + dir
    if (oneR !in 0..7) return

    val one = Square(File.entries[f], Rank.entries[oneR])
    if (pieces[one] == null) {
        addPawnMove(from, one, out)
        if (from.rank == startRank) {
            val two = Square(File.entries[f], Rank.entries[r + 2 * dir])
            if (pieces[two] == null) out += Move(from, two)
        }
    }
    for (df in listOf(-1, 1)) {
        val cf = f + df
        if (cf !in 0..7) continue
        val to = Square(File.entries[cf], Rank.entries[oneR])
        val occ = pieces[to]
        if (occ != null && occ.color != piece.color) {
            addPawnMove(from, to, out)
        } else if (occ == null && ruleSet.enPassantEnabled && enPassantTarget == to) {
            out += Move(from, to)
        }
    }
}

private fun addPawnMove(from: Square, to: Square, out: MutableList<Move>) {
    if (to.rank == Rank.ONE || to.rank == Rank.EIGHT) {
        out += Move(from, to, PieceType.QUEEN)
        out += Move(from, to, PieceType.ROOK)
        out += Move(from, to, PieceType.BISHOP)
        out += Move(from, to, PieceType.KNIGHT)
    } else {
        out += Move(from, to)
    }
}

private fun stepMoves(
    pieces: Map<Square, Piece>, from: Square, piece: Piece, steps: List<Pair<Int, Int>>, out: MutableList<Move>,
) {
    val f = from.file.ordinal
    val r = from.rank.ordinal
    for ((df, dr) in steps) {
        val to = square(f + df, r + dr) ?: continue
        val occ = pieces[to]
        if (occ == null || occ.color != piece.color) out += Move(from, to)
    }
}

private fun rayMoves(
    pieces: Map<Square, Piece>, from: Square, piece: Piece, dirs: List<Pair<Int, Int>>, out: MutableList<Move>,
) {
    val f = from.file.ordinal
    val r = from.rank.ordinal
    for ((df, dr) in dirs) {
        var nf = f + df
        var nr = r + dr
        while (nf in 0..7 && nr in 0..7) {
            val to = Square(File.entries[nf], Rank.entries[nr])
            val occ = pieces[to]
            if (occ == null) {
                out += Move(from, to)
            } else {
                if (occ.color != piece.color) out += Move(from, to)
                break
            }
            nf += df; nr += dr
        }
    }
}

private fun Position.castlingCandidates(
    pieces: Map<Square, Piece>, from: Square, king: Piece, ruleSet: RuleSet, out: MutableList<Move>,
) {
    if (!ruleSet.castlingEnabled) return
    val rank = if (king.color == Color.WHITE) Rank.ONE else Rank.EIGHT
    if (from != Square(File.E, rank)) return
    val r = castlingRights
    val kingSide = if (king.color == Color.WHITE) r.whiteKingSide else r.blackKingSide
    val queenSide = if (king.color == Color.WHITE) r.whiteQueenSide else r.blackQueenSide
    val rook = Piece(PieceType.ROOK, king.color)

    if (kingSide &&
        pieces[Square(File.F, rank)] == null && pieces[Square(File.G, rank)] == null &&
        pieces[Square(File.H, rank)] == rook
    ) {
        out += Move(from, Square(File.G, rank))
    }
    if (queenSide &&
        pieces[Square(File.D, rank)] == null && pieces[Square(File.C, rank)] == null &&
        pieces[Square(File.B, rank)] == null && pieces[Square(File.A, rank)] == rook
    ) {
        out += Move(from, Square(File.C, rank))
    }
}

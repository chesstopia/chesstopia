package io.chesstopia.backend.game.adapter.out.engine;

import io.chesstopia.backend.game.domain.CastlingRights;
import io.chesstopia.backend.game.domain.Color;
import io.chesstopia.backend.game.domain.File;
import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Piece;
import io.chesstopia.backend.game.domain.PieceType;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.Rank;
import io.chesstopia.backend.game.domain.RuleSet;
import io.chesstopia.backend.game.domain.Square;
import java.util.HashMap;
import java.util.Map;

/** Anti-Corruption-Layer: übersetzt zwischen Backend-Domäne und chess-engine. */
final class EngineMapper {

    private EngineMapper() {}

    // ── Index-Konvention: Engine-Brett ist Piece[64], Index 0 = a8 ──
    static int boardIndex(Square s) {
        return (7 - s.rank().ordinal()) * 8 + s.file().ordinal();
    }

    static io.chesstopia.engine.Position toEngine(Position p) {
        var board = new io.chesstopia.engine.Piece[64];
        for (var e : p.pieces().entrySet()) {
            board[boardIndex(e.getKey())] = new io.chesstopia.engine.Piece(
                io.chesstopia.engine.PieceType.valueOf(e.getValue().type().name()),
                io.chesstopia.engine.Color.valueOf(e.getValue().color().name()));
        }
        return new io.chesstopia.engine.Position(
            board,
            io.chesstopia.engine.Color.valueOf(p.sideToMove().name()),
            new io.chesstopia.engine.CastlingRights(
                p.castlingRights().whiteKingSide(), p.castlingRights().whiteQueenSide(),
                p.castlingRights().blackKingSide(), p.castlingRights().blackQueenSide()),
            p.enPassantTarget() == null ? null : toEngine(p.enPassantTarget()),
            p.halfmoveClock(), p.fullmoveNumber());
    }

    static Position toDomain(io.chesstopia.engine.Position p) {
        Map<Square, Piece> pieces = new HashMap<>();
        var board = p.getBoard();
        for (int i = 0; i < 64; i++) {
            var ep = board[i];
            if (ep == null) continue;
            pieces.put(square(i), new Piece(
                PieceType.valueOf(ep.getType().name()), Color.valueOf(ep.getColor().name())));
        }
        var c = p.getCastlingRights();
        return new Position(
            pieces,
            Color.valueOf(p.getSideToMove().name()),
            new CastlingRights(c.getWhiteKingSide(), c.getWhiteQueenSide(),
                               c.getBlackKingSide(), c.getBlackQueenSide()),
            p.getEnPassantTarget() == null ? null : square(p.getEnPassantTarget()),
            p.getHalfmoveClock(), p.getFullmoveNumber());
    }

    static io.chesstopia.engine.Square toEngine(Square s) {
        return new io.chesstopia.engine.Square(
            io.chesstopia.engine.File.valueOf(s.file().name()),
            io.chesstopia.engine.Rank.valueOf(s.rank().name()));
    }

    static Square square(io.chesstopia.engine.Square s) {
        return new Square(File.valueOf(s.getFile().name()), Rank.valueOf(s.getRank().name()));
    }

    static Square square(int index) {
        return new Square(File.values()[index % 8], Rank.values()[7 - index / 8]);
    }

    static io.chesstopia.engine.Move toEngine(Move m) {
        return new io.chesstopia.engine.Move(
            toEngine(m.from()), toEngine(m.to()),
            m.promotion() == null ? null
                : io.chesstopia.engine.PieceType.valueOf(m.promotion().name()));
    }

    static io.chesstopia.engine.RuleSet toEngine(RuleSet r) {
        return new io.chesstopia.engine.RuleSet(
            io.chesstopia.engine.Variant.valueOf(r.variant().name()),
            r.enPassantEnabled(), r.castlingEnabled());
    }
}

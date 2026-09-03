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

    static io.chesstopia.engine.Position toEngine(Position p) {
        var board = p.pieces().entrySet().stream()
            .map(e -> new io.chesstopia.engine.PlacedPiece(
                toEngine(e.getKey()),
                new io.chesstopia.engine.Piece(
                    io.chesstopia.engine.PieceType.valueOf(e.getValue().type().name()),
                    io.chesstopia.engine.Color.valueOf(e.getValue().color().name()))))
            .toArray(io.chesstopia.engine.PlacedPiece[]::new);
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
        for (var pp : p.getBoard()) {
            pieces.put(square(pp.getSquare()), new Piece(
                PieceType.valueOf(pp.getPiece().getType().name()),
                Color.valueOf(pp.getPiece().getColor().name())));
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

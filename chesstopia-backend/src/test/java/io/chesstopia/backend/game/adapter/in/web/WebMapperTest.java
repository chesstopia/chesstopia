package io.chesstopia.backend.game.adapter.in.web;

import io.chesstopia.backend.api.model.MoveRequest;
import io.chesstopia.backend.game.domain.CastlingRights;
import io.chesstopia.backend.game.domain.Color;
import io.chesstopia.backend.game.domain.File;
import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Piece;
import io.chesstopia.backend.game.domain.PieceType;
import io.chesstopia.backend.game.domain.Ply;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.Rank;
import io.chesstopia.backend.game.domain.Square;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

class WebMapperTest {

    private final WebMapper mapper = new WebMapperImpl();

    @Test
    void moveRequestZuDomaeneMitUndOhneUmwandlung() {
        var mitUmwandlung = new MoveRequest()
            .from(new io.chesstopia.backend.api.model.Square()
                .file(io.chesstopia.backend.api.model.Square.FileEnum.E)
                .rank(io.chesstopia.backend.api.model.Square.RankEnum.SEVEN))
            .to(new io.chesstopia.backend.api.model.Square()
                .file(io.chesstopia.backend.api.model.Square.FileEnum.E)
                .rank(io.chesstopia.backend.api.model.Square.RankEnum.EIGHT))
            .promotion(MoveRequest.PromotionEnum.QUEEN);

        Move m = mapper.toDomain(mitUmwandlung);
        assertThat(m.from()).isEqualTo(new Square(File.E, Rank.SEVEN));
        assertThat(m.to()).isEqualTo(new Square(File.E, Rank.EIGHT));
        assertThat(m.promotion()).isEqualTo(PieceType.QUEEN);

        var ohneUmwandlung = new MoveRequest()
            .from(new io.chesstopia.backend.api.model.Square()
                .file(io.chesstopia.backend.api.model.Square.FileEnum.E)
                .rank(io.chesstopia.backend.api.model.Square.RankEnum.TWO))
            .to(new io.chesstopia.backend.api.model.Square()
                .file(io.chesstopia.backend.api.model.Square.FileEnum.E)
                .rank(io.chesstopia.backend.api.model.Square.RankEnum.FOUR));

        Move plain = mapper.toDomain(ohneUmwandlung);
        assertThat(plain.promotion()).isNull();
    }

    @Test
    void positionZuApiUndDerBoardEnthaeltNurBesetzteFelder() {
        var pos = new Position(
            Map.of(new Square(File.E, Rank.ONE), new Piece(PieceType.KING, Color.WHITE)),
            Color.WHITE, CastlingRights.all(), null, 0, 1);

        var api = mapper.toApi(pos);

        assertThat(api.getBoard()).hasSize(1);
        assertThat(api.getBoard().get(0).getSquare()).isEqualTo(
            new io.chesstopia.backend.api.model.Square()
                .file(io.chesstopia.backend.api.model.Square.FileEnum.E)
                .rank(io.chesstopia.backend.api.model.Square.RankEnum.ONE));
        assertThat(api.getBoard().get(0).getPiece()).isEqualTo(
            new io.chesstopia.backend.api.model.Piece()
                .type(io.chesstopia.backend.api.model.Piece.TypeEnum.KING)
                .color(io.chesstopia.backend.api.model.Piece.ColorEnum.WHITE));
        assertThat(api.getSideToMove()).isEqualTo(
            io.chesstopia.backend.api.model.Position.SideToMoveEnum.WHITE);
        assertThat(api.getEnPassantTarget()).isNull();
        assertThat(api.getHalfmoveClock()).isZero();
        assertThat(api.getFullmoveNumber()).isEqualTo(1);
        assertThat(api.getCastlingRights().getWhiteKingSide()).isTrue();
    }

    @Test
    void piecesToBoardLiefertDieBesetztenFelderNachFeldNamenSortiert() {
        var pos = new Position(
            Map.of(
                new Square(File.H, Rank.ONE), new Piece(PieceType.ROOK, Color.WHITE),
                new Square(File.A, Rank.EIGHT), new Piece(PieceType.ROOK, Color.BLACK),
                new Square(File.A, Rank.ONE), new Piece(PieceType.QUEEN, Color.WHITE)),
            Color.WHITE, CastlingRights.all(), null, 0, 1);

        var board = mapper.toApi(pos).getBoard();

        assertThat(board).extracting(
                pp -> pp.getSquare().getFile(), pp -> pp.getSquare().getRank())
            .containsExactly(
                tuple(io.chesstopia.backend.api.model.Square.FileEnum.A,
                      io.chesstopia.backend.api.model.Square.RankEnum.ONE),
                tuple(io.chesstopia.backend.api.model.Square.FileEnum.A,
                      io.chesstopia.backend.api.model.Square.RankEnum.EIGHT),
                tuple(io.chesstopia.backend.api.model.Square.FileEnum.H,
                      io.chesstopia.backend.api.model.Square.RankEnum.ONE));
    }

    @Test
    void toMoveListNummeriertJedenHalbzug() {
        var pos = new Position(Map.of(), Color.WHITE, CastlingRights.all(), null, 0, 1);
        var history = List.of(
            new Ply(1, new Move(new Square(File.E, Rank.TWO), new Square(File.E, Rank.FOUR), null),
                pos, OffsetDateTime.parse("2026-01-01T12:00:00Z")),
            new Ply(2, new Move(new Square(File.E, Rank.SEVEN), new Square(File.E, Rank.FIVE), null),
                pos, OffsetDateTime.parse("2026-01-01T12:01:00Z")));

        var response = mapper.toMoveList(history);

        assertThat(response.getMoves()).extracting(
                io.chesstopia.backend.api.model.MoveRecord::getMoveNumber)
            .containsExactly(1, 2);
    }

    @Test
    void toPromotionUebersetztDieUmwandlungsfigurUndNull() {
        assertThat(mapper.toPromotion(PieceType.ROOK)).isEqualTo(MoveRequest.PromotionEnum.ROOK);
        assertThat(mapper.toPromotion(null)).isNull();
    }
}

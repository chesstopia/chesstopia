package io.chesstopia.backend.game.adapter.in.web;

import io.chesstopia.backend.api.model.MoveRequest;
import io.chesstopia.backend.game.domain.CastlingRights;
import io.chesstopia.backend.game.domain.Color;
import io.chesstopia.backend.game.domain.File;
import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Piece;
import io.chesstopia.backend.game.domain.PieceType;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.Rank;
import io.chesstopia.backend.game.domain.Square;
import java.util.Map;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

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
}

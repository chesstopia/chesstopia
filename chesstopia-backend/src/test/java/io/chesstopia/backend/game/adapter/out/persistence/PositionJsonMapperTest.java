package io.chesstopia.backend.game.adapter.out.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.chesstopia.backend.game.domain.*;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class PositionJsonMapperTest {

    private final ObjectMapper json = new ObjectMapper();
    private final PositionJsonMapper mapper = new PositionJsonMapperImpl();

    private final Position sample = new Position(
        Map.of(
            new Square(File.E, Rank.ONE), new Piece(PieceType.KING, Color.WHITE),
            new Square(File.D, Rank.EIGHT), new Piece(PieceType.QUEEN, Color.BLACK)),
        Color.BLACK,
        new CastlingRights(true, false, false, true),
        new Square(File.C, Rank.SIX),
        3, 17);

    @Test
    void squareCodecUebersetztInBeideRichtungen() {
        assertThat(SquareCodec.toText(new Square(File.E, Rank.TWO))).isEqualTo("e2");
        assertThat(SquareCodec.parse("h8")).isEqualTo(new Square(File.H, Rank.EIGHT));
    }

    @Test
    void domaeneZuJsonUndZurueckVerliertNichts() {
        assertThat(mapper.toDomain(mapper.toJson(sample))).isEqualTo(sample);
    }

    @Test
    void jsonIstLesbarSerialisierbar() throws Exception {
        String text = json.writeValueAsString(mapper.toJson(sample));
        assertThat(text).contains("\"square\":\"e1\"").contains("\"type\":\"KING\"");
        PositionJson back = json.readValue(text, PositionJson.class);
        assertThat(mapper.toDomain(back)).isEqualTo(sample);
    }

    @Test
    void nullEnPassantUeberlebtDenRoundtrip() {
        Position noEp = new Position(Map.of(), Color.WHITE, CastlingRights.none(), null, 0, 1);
        assertThat(mapper.toDomain(mapper.toJson(noEp))).isEqualTo(noEp);
    }

    @Test
    void piecesToBoardIstNachFeldTextSortiert() {
        Position pos = new Position(
            Map.of(
                new Square(File.H, Rank.ONE), new Piece(PieceType.ROOK, Color.WHITE),
                new Square(File.A, Rank.EIGHT), new Piece(PieceType.ROOK, Color.BLACK),
                new Square(File.A, Rank.ONE), new Piece(PieceType.QUEEN, Color.WHITE)),
            Color.WHITE, CastlingRights.none(), null, 0, 1);

        assertThat(mapper.toJson(pos).board())
            .extracting(PositionJson.PlacedPieceJson::square)
            .containsExactly("a1", "a8", "h1");
    }

    @Test
    void squareToTextUndTextToSquareSindNullSicher() {
        assertThat(mapper.squareToText(null)).isNull();
        assertThat(mapper.textToSquare(null)).isNull();
    }
}

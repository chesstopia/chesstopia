package io.chesstopia.backend.game.adapter.out.persistence.mapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.chesstopia.backend.game.adapter.out.persistence.entities.PositionJson;
import io.chesstopia.backend.game.adapter.out.persistence.entities.PositionJson.PlacedPieceJson;
import io.chesstopia.backend.game.domain.*;
import org.junit.jupiter.api.Test;
import java.util.List;
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

    // ---- die von Hand geschriebenen default-Methoden, je einzeln ----

    @Test
    void piecesToBoardIstNachFeldTextSortiertUndTraegtTypUndFarbeAlsName() {
        List<PlacedPieceJson> board = mapper.piecesToBoard(Map.of(
            new Square(File.H, Rank.ONE), new Piece(PieceType.ROOK, Color.WHITE),
            new Square(File.A, Rank.EIGHT), new Piece(PieceType.QUEEN, Color.BLACK),
            new Square(File.A, Rank.ONE), new Piece(PieceType.PAWN, Color.WHITE)));

        assertThat(board).containsExactly(
            new PlacedPieceJson("a1", "PAWN", "WHITE"),
            new PlacedPieceJson("a8", "QUEEN", "BLACK"),
            new PlacedPieceJson("h1", "ROOK", "WHITE"));
    }

    @Test
    void piecesToBoardAufLeererMapGibtLeereListe() {
        assertThat(mapper.piecesToBoard(Map.of())).isEmpty();
    }

    @Test
    void boardToPiecesParstFeldTextUndEnumNamen() {
        Map<Square, Piece> pieces = mapper.boardToPieces(List.of(
            new PlacedPieceJson("e1", "KING", "WHITE"),
            new PlacedPieceJson("d8", "QUEEN", "BLACK")));

        assertThat(pieces).containsOnly(
            entry(new Square(File.E, Rank.ONE), new Piece(PieceType.KING, Color.WHITE)),
            entry(new Square(File.D, Rank.EIGHT), new Piece(PieceType.QUEEN, Color.BLACK)));
    }

    @Test
    void squareToTextUebersetztUndIstNullSicher() {
        assertThat(mapper.squareToText(new Square(File.E, Rank.TWO))).isEqualTo("e2");
        assertThat(mapper.squareToText(null)).isNull();
    }

    @Test
    void textToSquareUebersetztUndIstNullSicher() {
        assertThat(mapper.textToSquare("e2")).isEqualTo(new Square(File.E, Rank.TWO));
        assertThat(mapper.textToSquare(null)).isNull();
    }
}

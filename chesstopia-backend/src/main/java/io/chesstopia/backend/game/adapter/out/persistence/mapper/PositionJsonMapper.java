package io.chesstopia.backend.game.adapter.out.persistence.mapper;

import io.chesstopia.backend.game.adapter.out.persistence.entities.PositionJson;
import io.chesstopia.backend.game.adapter.out.persistence.entities.PositionJson.PlacedPieceJson;
import io.chesstopia.backend.game.domain.Color;
import io.chesstopia.backend.game.domain.Piece;
import io.chesstopia.backend.game.domain.PieceType;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.Square;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PositionJsonMapper {

    @Mapping(target = "board", source = "pieces")
    @Mapping(target = "castling", source = "castlingRights")
    @Mapping(target = "enPassantTarget", source = "enPassantTarget")
    PositionJson toJson(Position position);

    @Mapping(target = "pieces", source = "board")
    @Mapping(target = "castlingRights", source = "castling")
    Position toDomain(PositionJson json);

    // MapStruct nutzt diese default-Methoden für Sammlungs- und Feld-Konvertierung:

    default List<PlacedPieceJson> piecesToBoard(Map<Square, Piece> pieces) {
        return pieces.entrySet().stream()
            .sorted(Comparator.comparing(e -> SquareCodec.toText(e.getKey())))
            .map(e -> new PlacedPieceJson(
                SquareCodec.toText(e.getKey()),
                e.getValue().type().name(),
                e.getValue().color().name()))
            .toList();
    }

    default Map<Square, Piece> boardToPieces(List<PlacedPieceJson> board) {
        Map<Square, Piece> pieces = new HashMap<>();
        for (PlacedPieceJson p : board) {
            pieces.put(SquareCodec.parse(p.square()),
                new Piece(PieceType.valueOf(p.type()), Color.valueOf(p.color())));
        }
        return pieces;
    }

    default String squareToText(Square s) {
        return s == null ? null : SquareCodec.toText(s);
    }

    default Square textToSquare(String s) {
        return s == null ? null : SquareCodec.parse(s);
    }
}

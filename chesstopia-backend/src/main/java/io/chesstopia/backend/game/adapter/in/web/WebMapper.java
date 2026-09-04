package io.chesstopia.backend.game.adapter.in.web;

import io.chesstopia.backend.api.model.MoveRequest;
import io.chesstopia.backend.api.model.PlacedPiece;
import io.chesstopia.backend.game.domain.Game;
import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Piece;
import io.chesstopia.backend.game.domain.PieceType;
import io.chesstopia.backend.game.domain.Ply;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.Square;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Übersetzt zwischen der {@code game}-Domäne und den generierten API-Modellen
 * ({@code io.chesstopia.backend.api.model}). Kein FEN, keine Notation — das Brett
 * geht als sortierte Liste besetzter Felder über die Grenze.
 *
 * <p>MapStruct-Interface: die generierten Modelle sind öffentliche POJOs mit
 * öffentlichen Accessoren, Enum-zu-Enum trägt über gleiche Konstantennamen. Die
 * einzige asymmetrische Abbildung — {@code PieceType} ↔ {@code PromotionEnum} —
 * liegt in den {@code default}-Methoden.
 */
@Mapper(componentModel = "spring")
public interface WebMapper {

    // ---- Domäne -> API ----

    @Mapping(target = "id", source = "game.id.value")
    @Mapping(target = "position", source = "game.currentPosition")
    @Mapping(target = "status", source = "game.status")
    @Mapping(target = "endReason", source = "game.endReason")
    @Mapping(target = "moveCount", source = "moveCount")
    io.chesstopia.backend.api.model.GameResponse toResponse(Game game, int moveCount);

    @Mapping(target = "board", source = "pieces")
    io.chesstopia.backend.api.model.Position toApi(Position position);

    io.chesstopia.backend.api.model.Square toApi(Square square);

    io.chesstopia.backend.api.model.Piece toApi(Piece piece);

    io.chesstopia.backend.api.model.CastlingRights toApi(io.chesstopia.backend.game.domain.CastlingRights castlingRights);

    MoveRequest toApi(Move move);

    @Mapping(target = "moveNumber", source = "number")
    io.chesstopia.backend.api.model.MoveRecord toRecord(Ply ply);

    default io.chesstopia.backend.api.model.MoveListResponse toMoveList(List<Ply> history) {
        var out = new io.chesstopia.backend.api.model.MoveListResponse();
        out.setMoves(history.stream().map(this::toRecord).toList());
        return out;
    }

    default List<PlacedPiece> piecesToBoard(Map<Square, Piece> pieces) {
        return pieces.entrySet().stream()
            .sorted(Comparator.comparing(e -> e.getKey().file().name() + e.getKey().rank().number()))
            .map(e -> new PlacedPiece()
                .square(toApi(e.getKey()))
                .piece(toApi(e.getValue())))
            .toList();
    }

    default MoveRequest.PromotionEnum toPromotion(PieceType type) {
        return type == null ? null : MoveRequest.PromotionEnum.valueOf(type.name());
    }

    // ---- API -> Domäne ----

    Move toDomain(MoveRequest req);

    Square toDomain(io.chesstopia.backend.api.model.Square sq);

    default PieceType toPieceType(MoveRequest.PromotionEnum promotion) {
        return promotion == null ? null : PieceType.valueOf(promotion.name());
    }
}

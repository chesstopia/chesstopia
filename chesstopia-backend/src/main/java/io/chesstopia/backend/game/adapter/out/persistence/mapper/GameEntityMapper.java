package io.chesstopia.backend.game.adapter.out.persistence.mapper;

import io.chesstopia.backend.game.adapter.out.persistence.entities.ZugEntity;
import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Ply;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Übersetzt einen {@link Ply} in eine {@link ZugEntity} und zurück.
 *
 * <p>Die flachen Zug-Spalten ({@code from_square}, {@code to_square},
 * {@code promotion}) tragen das verschachtelte {@link Move} — MapStruct flacht
 * die Quelle über {@code move.from} ab. {@code id}, {@code partieId} und die
 * Zeitmessung setzt der {@code GamePersistenceAdapter} nach dem Mapping. Über
 * {@code uses = PositionJsonMapper.class} kommen {@code Position ↔ PositionJson}
 * und {@code Square ↔ "e2"} (dessen {@code default}-Methoden).
 */
@Mapper(componentModel = "spring", uses = PositionJsonMapper.class)
public interface GameEntityMapper {

    @Mapping(target = "moveNumber", source = "number")
    @Mapping(target = "fromSquare", source = "move.from")
    @Mapping(target = "toSquare", source = "move.to")
    @Mapping(target = "promotion", source = "move.promotion")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "partieId", ignore = true)
    @Mapping(target = "timeSpentMs", ignore = true)
    ZugEntity toEntity(Ply ply);

    @Mapping(target = "number", source = "moveNumber")
    @Mapping(target = "move", source = "zug")
    Ply toPly(ZugEntity zug);

    @Mapping(target = "from", source = "fromSquare")
    @Mapping(target = "to", source = "toSquare")
    Move toMove(ZugEntity zug);
}

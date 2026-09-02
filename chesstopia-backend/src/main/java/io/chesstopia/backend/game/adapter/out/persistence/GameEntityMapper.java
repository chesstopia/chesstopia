package io.chesstopia.backend.game.adapter.out.persistence;

import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.PieceType;
import io.chesstopia.backend.game.domain.Ply;
import org.springframework.stereotype.Component;

/**
 * Übersetzt einen {@link Ply} in eine {@link ZugEntity} und zurück. Die flachen
 * Zug-Spalten ({@code from_square}, {@code to_square}, {@code promotion}) tragen
 * das verschachtelte {@link Move}; {@code positionAfter} geht als lesbares
 * {@link PositionJson} über den {@link PositionJsonMapper}.
 *
 * Von Hand geschrieben statt MapStruct: MapStruct erkennt an den
 * package-private Accessoren der Entities keine Properties, und die flache
 * {@code Move}-Zerlegung braucht ohnehin Ausdrücke. Die Aggregat-Montage
 * ({@code Game}) liegt im {@link GamePersistenceAdapter}.
 */
@Component
final class GameEntityMapper {

    private final PositionJsonMapper positionJsonMapper;

    GameEntityMapper(PositionJsonMapper positionJsonMapper) {
        this.positionJsonMapper = positionJsonMapper;
    }

    ZugEntity toEntity(Ply ply) {
        Move move = ply.move();
        ZugEntity zug = new ZugEntity();
        zug.setMoveNumber(ply.number());
        zug.setFromSquare(SquareCodec.toText(move.from()));
        zug.setToSquare(SquareCodec.toText(move.to()));
        zug.setPromotion(move.promotion() == null ? null : move.promotion().name());
        zug.setPositionAfter(positionJsonMapper.toJson(ply.positionAfter()));
        zug.setPlayedAt(ply.playedAt());
        return zug;
    }

    Ply toPly(ZugEntity zug) {
        Move move = new Move(
            SquareCodec.parse(zug.getFromSquare()),
            SquareCodec.parse(zug.getToSquare()),
            zug.getPromotion() == null ? null : PieceType.valueOf(zug.getPromotion()));
        return new Ply(
            zug.getMoveNumber(),
            move,
            positionJsonMapper.toDomain(zug.getPositionAfter()),
            zug.getPlayedAt());
    }
}

package io.chesstopia.backend.game.adapter.out.engine;

import io.chesstopia.backend.game.domain.CastlingRights;
import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Piece;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.RuleSet;
import io.chesstopia.backend.game.domain.Square;
import java.util.HashMap;
import java.util.Map;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Anti-Corruption-Layer zwischen der {@code game}-Domäne und der chess-engine.
 *
 * <p>MapStruct-Interface: die Engine-Typen sind Kotlin-{@code data class}es, deren
 * JVM-Getter und Primärkonstruktor MapStruct liest (der Engine-JVM-Build trägt
 * {@code -java-parameters}). Enum-zu-Enum trägt über gleiche Konstantennamen —
 * ein Engine-Enum-Wert ohne Domänen-Pendant ist ein Compile-Fehler. Einzige
 * Handarbeit ist die Brücke {@code Map<Square,Piece>} ↔ {@code PlacedPiece[]}.
 */
@Mapper(componentModel = "spring")
interface EngineMapper {

    // ---- Domäne -> Engine ----

    @Mapping(target = "board", source = "pieces")
    io.chesstopia.engine.Position toEngine(Position position);

    io.chesstopia.engine.Move toEngine(Move move);

    io.chesstopia.engine.Square toEngine(Square square);

    io.chesstopia.engine.Piece toEngine(Piece piece);

    io.chesstopia.engine.CastlingRights toEngine(CastlingRights castlingRights);

    io.chesstopia.engine.RuleSet toEngine(RuleSet ruleSet);

    default io.chesstopia.engine.PlacedPiece[] toEngineBoard(Map<Square, Piece> pieces) {
        return pieces.entrySet().stream()
            .map(e -> new io.chesstopia.engine.PlacedPiece(toEngine(e.getKey()), toEngine(e.getValue())))
            .toArray(io.chesstopia.engine.PlacedPiece[]::new);
    }

    // ---- Engine -> Domäne ----

    @Mapping(target = "pieces", source = "board")
    Position toDomain(io.chesstopia.engine.Position position);

    Square toDomain(io.chesstopia.engine.Square square);

    Piece toDomain(io.chesstopia.engine.Piece piece);

    CastlingRights toDomain(io.chesstopia.engine.CastlingRights castlingRights);

    default Map<Square, Piece> toDomainBoard(io.chesstopia.engine.PlacedPiece[] board) {
        Map<Square, Piece> pieces = new HashMap<>();
        for (var placed : board) {
            pieces.put(toDomain(placed.getSquare()), toDomain(placed.getPiece()));
        }
        return pieces;
    }
}

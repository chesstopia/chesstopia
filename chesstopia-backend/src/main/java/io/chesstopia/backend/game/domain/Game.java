package io.chesstopia.backend.game.domain;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Eine Partie zwischen zwei Spielern (docs/context.md) als Aggregat.
 *
 * Immutable: {@link #play} gibt ein neues Game. Die resultierende Stellung kommt
 * von außen — sie zu berechnen ist Sache der Engine (Out-Port ChessRules). Das
 * Aggregat ruft KEINEN Port und macht KEIN I/O.
 */
public record Game(
    GameId id,
    RuleSet ruleSet,
    Position currentPosition,
    List<Ply> history,
    GameStatus status,
    EndReason endReason,        // null solange status == ONGOING
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public Game {
        history = List.copyOf(history);
    }

    public static Game start(GameId id, RuleSet ruleSet, Position initialPosition, OffsetDateTime now) {
        return new Game(id, ruleSet, initialPosition, List.of(), GameStatus.ONGOING, null, now, now);
    }

    public Game play(Move move, Position resultingPosition, GameConclusion conclusion, OffsetDateTime now) {
        if (status != GameStatus.ONGOING) {
            throw new IllegalStateException("Partie %s ist beendet".formatted(id.value()));
        }
        var next = new ArrayList<>(history);
        next.add(new Ply(next.size() + 1, move, resultingPosition, now));
        return new Game(id, ruleSet, resultingPosition, next,
            conclusion.status(), conclusion.endReason(), createdAt, now);
    }
}

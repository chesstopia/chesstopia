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

    public Game play(Move move, Position resultingPosition, GameOutcome outcome, OffsetDateTime now) {
        if (status != GameStatus.ONGOING) {
            throw new IllegalStateException("Partie %s ist beendet".formatted(id.value()));
        }
        var next = new ArrayList<>(history);
        next.add(new Ply(next.size() + 1, move, resultingPosition, now));

        GameStatus newStatus = switch (outcome.kind()) {
            case IN_PROGRESS -> GameStatus.ONGOING;
            case CHECKMATE -> outcome.winner() == Color.WHITE ? GameStatus.WHITE_WON : GameStatus.BLACK_WON;
            case STALEMATE, DRAW_FIFTY_MOVE, DRAW_INSUFFICIENT_MATERIAL, DRAW_THREEFOLD_REPETITION -> GameStatus.DRAW;
        };
        EndReason newReason = switch (outcome.kind()) {
            case IN_PROGRESS -> null;
            case CHECKMATE -> EndReason.CHECKMATE;
            case STALEMATE -> EndReason.STALEMATE;
            case DRAW_FIFTY_MOVE -> EndReason.FIFTY_MOVE_RULE;
            case DRAW_INSUFFICIENT_MATERIAL -> EndReason.INSUFFICIENT_MATERIAL;
            case DRAW_THREEFOLD_REPETITION -> EndReason.THREEFOLD_REPETITION;
        };
        return new Game(id, ruleSet, resultingPosition, next, newStatus, newReason, createdAt, now);
    }
}

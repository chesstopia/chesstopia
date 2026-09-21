package io.chesstopia.backend.game.domain;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Eine Partie zwischen zwei Spielern (docs/context.md) als Aggregat.
 *
 * Immutable: {@link #play} gibt ein neues Game. Die resultierende Stellung kommt
 * von außen — sie zu berechnen ist Sache der Engine (Out-Port ChessRules). Das
 * Aggregat ruft KEINEN Port und macht KEIN I/O.
 *
 * {@code ownerToken}/{@code inviteToken}: Nachweise für Weiß (Ersteller) und
 * Schwarz (Einladung) ohne Login. Werden einmal in {@link #start} erzeugt und
 * bleiben über die gesamte Partie unverändert — {@link #roleOf} ist die einzige
 * Stelle, die sie interpretiert.
 */
public record Game(
    GameId id,
    PlayerToken ownerToken,
    PlayerToken inviteToken,
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
        return new Game(id, PlayerToken.newToken(), PlayerToken.newToken(), ruleSet, initialPosition,
            List.of(), GameStatus.ONGOING, null, now, now);
    }

    public Game play(Move move, Position resultingPosition, GameConclusion conclusion, OffsetDateTime now) {
        if (status != GameStatus.ONGOING) {
            throw new IllegalStateException("Partie %s ist beendet".formatted(id.value()));
        }
        var next = new ArrayList<>(history);
        next.add(new Ply(next.size() + 1, move, resultingPosition, now));
        return new Game(id, ownerToken, inviteToken, ruleSet, resultingPosition, next,
            conclusion.status(), conclusion.endReason(), createdAt, now);
    }

    /** Welche Farbe {@code token} steuern darf, wenn überhaupt. */
    public Optional<Color> roleOf(PlayerToken token) {
        if (token == null) return Optional.empty();
        if (token.equals(ownerToken)) return Optional.of(Color.WHITE);
        if (token.equals(inviteToken)) return Optional.of(Color.BLACK);
        return Optional.empty();
    }
}

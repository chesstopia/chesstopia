package io.chesstopia.backend.game.domain;

import java.time.OffsetDateTime;

public record Ply(int number, Move move, Position positionAfter, OffsetDateTime playedAt) {
}

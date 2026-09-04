package io.chesstopia.backend.game.domain;

public enum OutcomeKind {
    IN_PROGRESS, CHECKMATE, STALEMATE,
    DRAW_FIFTY_MOVE, DRAW_INSUFFICIENT_MATERIAL, DRAW_THREEFOLD_REPETITION
}

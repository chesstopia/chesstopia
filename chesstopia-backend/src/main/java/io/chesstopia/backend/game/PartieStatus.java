package io.chesstopia.backend.game;

/**
 * Zustand einer Partie — läuft noch oder ist beendet.
 *
 * {@code COMPLETED} wird gesetzt, wenn die Regellogik nach einem Zug Matt,
 * Patt oder die 50-Züge-Regel meldet ({@code GameService.playMove}). Ein Zug
 * auf einer bereits beendeten Partie wird abgelehnt.
 */
enum PartieStatus {
    ONGOING,
    COMPLETED,
}

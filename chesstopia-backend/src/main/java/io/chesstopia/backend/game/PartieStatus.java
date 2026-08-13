package io.chesstopia.backend.game;

/**
 * Zustand einer Partie — läuft noch oder ist beendet.
 *
 * {@code COMPLETED} ist heute unerreichbar: Ob eine Partie zu Ende ist, weiß
 * nur die Regellogik (Matt, Patt, 50-Züge-Regel), und die gibt es erst mit
 * CHESS-2. Der Wert steht trotzdem hier, weil der Kontrakt ihn ausweist und
 * ein einwertiges Feld keine Aussage trägt.
 */
enum PartieStatus {
    ONGOING,
    COMPLETED,
}

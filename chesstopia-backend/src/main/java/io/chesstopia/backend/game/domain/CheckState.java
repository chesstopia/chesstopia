package io.chesstopia.backend.game.domain;

/**
 * Welche Seite im Schach steht; im Matt die mattgesetzte. Kommt fertig von der
 * Engine — die Domäne interpretiert ihn nicht.
 */
public enum CheckState {
    NO_CHECK, CHECK_WHITE, CHECK_BLACK
}

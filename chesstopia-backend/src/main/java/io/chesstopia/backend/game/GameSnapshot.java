package io.chesstopia.backend.game;

import java.util.UUID;

/**
 * Was der Controller von einer Partie sieht.
 *
 * Die Entität bleibt im Feature: Sie trägt Persistenzannotationen, einen
 * Lebenszyklus und einen Lazy-Verweis, und nichts davon geht die REST-Schicht
 * etwas an. Handmapping, kein MapStruct (Verbot 5).
 */
record GameSnapshot(UUID id, String fen, PartieStatus status, int moveCount) {

    static GameSnapshot of(Partie partie, int moveCount) {
        return new GameSnapshot(partie.getId(), partie.getCurrentFen(), partie.getStatus(), moveCount);
    }
}

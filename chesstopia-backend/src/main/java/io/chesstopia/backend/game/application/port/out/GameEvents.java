package io.chesstopia.backend.game.application.port.out;

import io.chesstopia.backend.game.domain.Game;

/**
 * Vom WebSocket-Adapter implementiert: benachrichtigt verbundene Clients über
 * einen gespielten Zug. Der Service kennt nur den Port, keinen Transport.
 */
public interface GameEvents {
    void moveWasPlayed(Game game);
}

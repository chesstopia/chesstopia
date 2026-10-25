package io.chesstopia.backend.game.application.port.out;

import io.chesstopia.backend.game.domain.Game;
import io.chesstopia.backend.game.domain.GameId;

/**
 * Vom WebSocket-Adapter implementiert: benachrichtigt verbundene Clients über
 * einen gespielten Zug und über eine gelöschte Partie. Der Service kennt nur den Port, keinen Transport.
 */
public interface GameEvents {
    void moveWasPlayed(Game game);

    void gameWasDeleted(GameId gameId);
}

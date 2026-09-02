package io.chesstopia.backend.game.application.port.in;

import io.chesstopia.backend.game.domain.Game;
import io.chesstopia.backend.game.domain.GameId;

/**
 * Vom Web-Adapter aufgerufen: Lädt eine Partie zum Ansehen.
 */
public interface ViewGame {
    Game load(GameId gameId);
}

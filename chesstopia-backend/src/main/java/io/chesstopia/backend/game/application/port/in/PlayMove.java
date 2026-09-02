package io.chesstopia.backend.game.application.port.in;

import io.chesstopia.backend.game.domain.Game;
import io.chesstopia.backend.game.domain.GameId;
import io.chesstopia.backend.game.domain.Move;

/**
 * Vom Web-Adapter aufgerufen: Führt einen Zug in einer Partie aus.
 */
public interface PlayMove {
    Game play(GameId gameId, Move move);
}

package io.chesstopia.backend.game.application.port.in;

import io.chesstopia.backend.game.domain.GameId;
import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Position;

/**
 * Vom Web-Adapter aufgerufen: Führt einen Zug in einer Partie aus.
 */
public interface PlayMove {
    Position play(GameId gameId, Move move);
}

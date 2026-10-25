package io.chesstopia.backend.game.application.port.in;

import io.chesstopia.backend.game.domain.GameId;
import io.chesstopia.backend.game.domain.PlayerToken;

/**
 * Vom Web-Adapter aufgerufen: Löscht eine Partie samt Zügen. Erlaubt ist das nur dem
 * Ersteller (Owner-Token).
 */
public interface DeleteGame {
    void delete(GameId gameId, PlayerToken playerToken);
}

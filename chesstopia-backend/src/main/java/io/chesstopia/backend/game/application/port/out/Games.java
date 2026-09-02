package io.chesstopia.backend.game.application.port.out;

import io.chesstopia.backend.game.domain.Game;
import io.chesstopia.backend.game.domain.GameId;

import java.util.Optional;

/**
 * Vom Persistence-Adapter implementiert: Persistiert und lädt Partien.
 */
public interface Games {
    Game save(Game game);
    Optional<Game> findById(GameId id);
}

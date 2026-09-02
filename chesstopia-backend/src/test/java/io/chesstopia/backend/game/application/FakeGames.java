package io.chesstopia.backend.game.application;

import io.chesstopia.backend.game.application.port.out.Games;
import io.chesstopia.backend.game.domain.Game;
import io.chesstopia.backend.game.domain.GameId;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Test-Double für {@link Games}: In-Memory-Map, kein I/O.
 */
class FakeGames implements Games {

    private final Map<GameId, Game> store = new HashMap<>();

    @Override
    public Game save(Game game) {
        store.put(game.id(), game);
        return game;
    }

    @Override
    public Optional<Game> findById(GameId id) {
        return Optional.ofNullable(store.get(id));
    }
}

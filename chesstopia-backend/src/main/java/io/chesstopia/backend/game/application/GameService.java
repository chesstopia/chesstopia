package io.chesstopia.backend.game.application;

import io.chesstopia.backend.error.NotFoundException;
import io.chesstopia.backend.game.application.port.in.PlayMove;
import io.chesstopia.backend.game.application.port.in.StartGame;
import io.chesstopia.backend.game.application.port.in.ViewGame;
import io.chesstopia.backend.game.application.port.out.ChessRules;
import io.chesstopia.backend.game.application.port.out.Games;
import io.chesstopia.backend.game.domain.Game;
import io.chesstopia.backend.game.domain.GameId;
import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.RuleSet;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/**
 * Orchestriert die In-Ports des game-Features über die Out-Ports.
 *
 * Der einzige Ort, an dem der Ablauf zusammenläuft: Regeln kommen aus
 * {@link ChessRules}, Persistenz aus {@link Games}. Keine Schachlogik, kein
 * Engine-Import, kein FEN.
 */
@Service
class GameService implements StartGame, PlayMove, ViewGame {

    private final Games games;
    private final ChessRules chessRules;

    GameService(Games games, ChessRules chessRules) {
        this.games = games;
        this.chessRules = chessRules;
    }

    @Override
    @Transactional
    public Game start(RuleSet ruleSet) {
        OffsetDateTime now = OffsetDateTime.now();
        Position initialPosition = chessRules.initialPosition(ruleSet);
        return games.save(Game.start(GameId.newId(), ruleSet, initialPosition, now));
    }

    @Override
    @Transactional
    public Game play(GameId gameId, Move move) {
        Game game = games.findById(gameId)
            .orElseThrow(() -> new NotFoundException("Partie %s existiert nicht".formatted(gameId.value())));
        if (!chessRules.isExecutable(game.currentPosition(), move, game.ruleSet())) {
            throw new IllegalArgumentException("Der Zug ist in dieser Stellung nicht ausführbar");
        }
        Position resulting = chessRules.apply(game.currentPosition(), move, game.ruleSet());
        return games.save(game.play(move, resulting, OffsetDateTime.now()));
    }

    @Override
    @Transactional(readOnly = true)
    public Game load(GameId gameId) {
        return games.findById(gameId)
            .orElseThrow(() -> new NotFoundException("Partie %s existiert nicht".formatted(gameId.value())));
    }
}

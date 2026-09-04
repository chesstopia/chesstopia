package io.chesstopia.backend.game.application;

import io.chesstopia.backend.error.NotFoundException;
import io.chesstopia.backend.game.application.port.in.PlayMove;
import io.chesstopia.backend.game.application.port.in.StartGame;
import io.chesstopia.backend.game.application.port.in.ViewGame;
import io.chesstopia.backend.game.application.port.out.ChessEngine;
import io.chesstopia.backend.game.application.port.out.GamesRepository;
import io.chesstopia.backend.game.domain.Game;
import io.chesstopia.backend.game.domain.GameId;
import io.chesstopia.backend.game.domain.GameOutcome;
import io.chesstopia.backend.game.domain.GameStatus;
import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.RuleSet;
import io.chesstopia.backend.game.domain.Square;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Orchestriert die In-Ports des game-Features über die Out-Ports.
 *
 * Der einzige Ort, an dem der Ablauf zusammenläuft: Regeln kommen aus
 * {@link ChessEngine}, Persistenz aus {@link GamesRepository}. Keine Schachlogik, kein
 * Engine-Import, kein FEN.
 */
@Service
class GameService implements StartGame, PlayMove, ViewGame {

    private final GamesRepository gamesRepository;
    private final ChessEngine chessEngine;

    GameService(GamesRepository gamesRepository, ChessEngine chessEngine) {
        this.gamesRepository = gamesRepository;
        this.chessEngine = chessEngine;
    }

    @Override
    @Transactional
    public Game start(RuleSet ruleSet) {
        OffsetDateTime now = OffsetDateTime.now();
        Position initialPosition = chessEngine.initialPosition(ruleSet);
        return gamesRepository.save(Game.start(GameId.newId(), ruleSet, initialPosition, now));
    }

    @Override
    @Transactional
    public Game play(GameId gameId, Move move) {
        Game game = gamesRepository.findById(gameId)
            .orElseThrow(() -> new NotFoundException("Partie %s existiert nicht".formatted(gameId.value())));
        if (game.status() != GameStatus.ONGOING) {
            throw new IllegalArgumentException("Partie %s ist bereits beendet".formatted(gameId.value()));
        }
        if (!chessEngine.isLegal(game.currentPosition(), move, game.ruleSet())) {
            throw new IllegalArgumentException(
                "Der Zug %s→%s ist in dieser Stellung nicht legal".formatted(
                    square(move.from()), square(move.to())));
        }
        Position resulting = chessEngine.apply(game.currentPosition(), move, game.ruleSet());

        List<Position> positions = new ArrayList<>();
        positions.add(chessEngine.initialPosition(game.ruleSet()));
        game.history().forEach(p -> positions.add(p.positionAfter()));
        positions.add(resulting);
        GameOutcome outcome = chessEngine.outcome(positions, game.ruleSet());

        return gamesRepository.save(game.play(move, resulting, outcome, OffsetDateTime.now()));
    }

    @Override
    @Transactional(readOnly = true)
    public Game load(GameId gameId) {
        return gamesRepository.findById(gameId)
            .orElseThrow(() -> new NotFoundException("Partie %s existiert nicht".formatted(gameId.value())));
    }

    private static String square(Square s) {
        return s.file().name().toLowerCase() + s.rank().number();
    }
}

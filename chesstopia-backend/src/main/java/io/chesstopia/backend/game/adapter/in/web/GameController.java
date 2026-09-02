package io.chesstopia.backend.game.adapter.in.web;

import io.chesstopia.backend.api.GameApi;
import io.chesstopia.backend.api.model.GameResponse;
import io.chesstopia.backend.api.model.MoveListResponse;
import io.chesstopia.backend.api.model.MoveRequest;
import io.chesstopia.backend.game.application.port.in.PlayMove;
import io.chesstopia.backend.game.application.port.in.StartGame;
import io.chesstopia.backend.game.application.port.in.ViewGame;
import io.chesstopia.backend.game.domain.Game;
import io.chesstopia.backend.game.domain.GameId;
import io.chesstopia.backend.game.domain.RuleSet;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/**
 * Web-Adapter des {@code game}-Features: implementiert das aus
 * {@code docs/api/openapi.yaml} generierte {@link GameApi}. Kein eigenes
 * {@code @RequestMapping}, keine Pfad-Literale (CLAUDE.md, Verbot 2) — Pfade,
 * Methoden und Status kommen aus dem Kontrakt.
 */
@RestController
class GameController implements GameApi {

    private final StartGame startGame;
    private final PlayMove playMove;
    private final ViewGame viewGame;
    private final WebMapper mapper;

    GameController(StartGame startGame, PlayMove playMove, ViewGame viewGame, WebMapper mapper) {
        this.startGame = startGame;
        this.playMove = playMove;
        this.viewGame = viewGame;
        this.mapper = mapper;
    }

    @Override
    public ResponseEntity<GameResponse> createGame() {
        GameId id = startGame.start(RuleSet.standard());
        Game game = viewGame.load(id);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mapper.toResponse(game, game.history().size()));
    }

    @Override
    public ResponseEntity<GameResponse> getGame(UUID gameId) {
        Game game = viewGame.load(new GameId(gameId));
        return ResponseEntity.ok(mapper.toResponse(game, game.history().size()));
    }

    @Override
    public ResponseEntity<GameResponse> playMove(UUID gameId, MoveRequest moveRequest) {
        playMove.play(new GameId(gameId), mapper.toDomain(moveRequest));
        Game game = viewGame.load(new GameId(gameId));
        return ResponseEntity.ok(mapper.toResponse(game, game.history().size()));
    }

    @Override
    public ResponseEntity<MoveListResponse> listMoves(UUID gameId) {
        Game game = viewGame.load(new GameId(gameId));
        return ResponseEntity.ok(mapper.toMoveList(game.history()));
    }
}

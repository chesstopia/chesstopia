package io.chesstopia.backend.game;

import io.chesstopia.backend.api.GameApi;
import io.chesstopia.backend.api.model.BoardStateResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GameController implements GameApi {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @Override
    public ResponseEntity<BoardStateResponse> getBoard() {
        return ResponseEntity.ok(new BoardStateResponse(gameService.getInitialFen()));
    }
}

package io.chesstopia.backend.game;

import io.chesstopia.backend.api.GameApi;
import io.chesstopia.backend.api.model.BoardStateResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GameController implements GameApi {

    private static final String INITIAL_FEN =
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    @Override
    public ResponseEntity<BoardStateResponse> getBoard() {
        return ResponseEntity.ok(new BoardStateResponse(INITIAL_FEN));
    }
}

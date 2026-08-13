package io.chesstopia.backend.game;

import io.chesstopia.backend.api.GameApi;
import io.chesstopia.backend.api.model.GameResponse;
import io.chesstopia.backend.api.model.MoveListResponse;
import io.chesstopia.backend.api.model.MoveRecord;
import io.chesstopia.backend.api.model.MoveRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class GameController implements GameApi {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @Override
    public ResponseEntity<GameResponse> createGame() {
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(gameService.createGame()));
    }

    @Override
    public ResponseEntity<GameResponse> getGame(UUID gameId) {
        return ResponseEntity.ok(toResponse(gameService.getGame(gameId)));
    }

    @Override
    public ResponseEntity<GameResponse> playMove(UUID gameId, MoveRequest moveRequest) {
        return ResponseEntity.ok(toResponse(gameService.playMove(gameId, moveRequest.getUci())));
    }

    @Override
    public ResponseEntity<MoveListResponse> listMoves(UUID gameId) {
        List<MoveRecord> moves = gameService.getMoves(gameId).stream()
            .map(GameController::toRecord)
            .toList();
        return ResponseEntity.ok(new MoveListResponse(moves));
    }

    private static GameResponse toResponse(GameSnapshot snapshot) {
        return new GameResponse(
            snapshot.id(),
            snapshot.fen(),
            GameResponse.StatusEnum.fromValue(snapshot.status().name()),
            snapshot.moveCount()
        );
    }

    private static MoveRecord toRecord(Zug zug) {
        return new MoveRecord(zug.getMoveNumber(), zug.getUci(), zug.getFenAfter(), zug.getPlayedAt());
    }
}

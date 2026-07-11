package io.chesstopia.backend.game;

import org.springframework.stereotype.Service;

@Service
public class GameService {

    private static final String INITIAL_FEN =
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    public String getInitialFen() {
        return INITIAL_FEN;
    }
}

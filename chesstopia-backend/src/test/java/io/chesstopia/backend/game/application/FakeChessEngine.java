package io.chesstopia.backend.game.application;

import io.chesstopia.backend.game.application.port.out.ChessEngine;
import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.RuleSet;

/**
 * Test-Double für {@link ChessEngine}: liefert feste Stellungen, kein Engine-Aufruf.
 */
class FakeChessEngine implements ChessEngine {

    private final Position initial;
    private final Position afterApply;
    private boolean executable = true;

    FakeChessEngine(Position initial, Position afterApply) {
        this.initial = initial;
        this.afterApply = afterApply;
    }

    void rejectEverything() {
        this.executable = false;
    }

    @Override
    public Position initialPosition(RuleSet ruleSet) {
        return initial;
    }

    @Override
    public boolean isExecutable(Position position, Move move, RuleSet ruleSet) {
        return executable;
    }

    @Override
    public Position apply(Position position, Move move, RuleSet ruleSet) {
        return afterApply;
    }
}

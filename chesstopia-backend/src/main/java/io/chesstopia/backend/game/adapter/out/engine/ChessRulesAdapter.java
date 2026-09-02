package io.chesstopia.backend.game.adapter.out.engine;

import io.chesstopia.backend.game.application.port.out.ChessRules;
import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.RuleSet;
import io.chesstopia.engine.ChessEngineKt;
import org.springframework.stereotype.Component;

/**
 * Kapselt die chess-engine hinter dem {@link ChessRules}-Port. Zusammen mit
 * {@link EngineMapper} die einzige Klasse im game-Feature, die {@code io.chesstopia.engine.*}
 * importiert.
 */
@Component
class ChessRulesAdapter implements ChessRules {

    @Override
    public Position initialPosition(RuleSet ruleSet) {
        return EngineMapper.toDomain(ChessEngineKt.initialPosition(EngineMapper.toEngine(ruleSet)));
    }

    @Override
    public boolean isExecutable(Position position, Move move, RuleSet ruleSet) {
        return ChessEngineKt.validateMove(
            EngineMapper.toEngine(position), EngineMapper.toEngine(move), EngineMapper.toEngine(ruleSet));
    }

    @Override
    public Position apply(Position position, Move move, RuleSet ruleSet) {
        return EngineMapper.toDomain(ChessEngineKt.applyMove(
            EngineMapper.toEngine(position), EngineMapper.toEngine(move), EngineMapper.toEngine(ruleSet)));
    }
}

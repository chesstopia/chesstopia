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
 * berührt.
 */
@Component
class ChessRulesAdapter implements ChessRules {

    private final EngineMapper mapper;

    ChessRulesAdapter(EngineMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public Position initialPosition(RuleSet ruleSet) {
        return mapper.toDomain(ChessEngineKt.initialPosition(mapper.toEngine(ruleSet)));
    }

    @Override
    public boolean isExecutable(Position position, Move move, RuleSet ruleSet) {
        return ChessEngineKt.validateMove(
            mapper.toEngine(position), mapper.toEngine(move), mapper.toEngine(ruleSet));
    }

    @Override
    public Position apply(Position position, Move move, RuleSet ruleSet) {
        return mapper.toDomain(ChessEngineKt.applyMove(
            mapper.toEngine(position), mapper.toEngine(move), mapper.toEngine(ruleSet)));
    }
}

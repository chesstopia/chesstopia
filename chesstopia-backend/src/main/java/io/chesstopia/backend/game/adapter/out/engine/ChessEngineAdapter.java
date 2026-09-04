package io.chesstopia.backend.game.adapter.out.engine;

import io.chesstopia.backend.game.application.port.out.ChessEngine;
import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.RuleSet;
import io.chesstopia.engine.ChessEngineKt;
import org.springframework.stereotype.Component;

/**
 * Kapselt die chess-engine hinter dem {@link ChessEngine}-Port. Zusammen mit
 * {@link EngineMapper} die einzige Klasse im game-Feature, die {@code io.chesstopia.engine.*}
 * berührt.
 */
@Component
class ChessEngineAdapter implements ChessEngine {

    private final EngineMapper mapper;

    ChessEngineAdapter(EngineMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public Position initialPosition(RuleSet ruleSet) {
        return mapper.toDomain(ChessEngineKt.initialPosition(mapper.toEngine(ruleSet)));
    }

    @Override
    public boolean isLegal(Position position, Move move, RuleSet ruleSet) {
        return ChessEngineKt.validateMove(
            mapper.toEngine(position), mapper.toEngine(move), mapper.toEngine(ruleSet));
    }

    @Override
    public Position apply(Position position, Move move, RuleSet ruleSet) {
        return mapper.toDomain(ChessEngineKt.applyMove(
            mapper.toEngine(position), mapper.toEngine(move), mapper.toEngine(ruleSet)));
    }
}

package io.chesstopia.backend.game.application.port.out;

import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.RuleSet;

/**
 * Vom Chess-Engine-Adapter implementiert: Verwaltet Schachregeln und validiert Züge.
 */
public interface ChessRules {
    Position initialPosition(RuleSet ruleSet);
    boolean isExecutable(Position position, Move move, RuleSet ruleSet);
    Position apply(Position position, Move move, RuleSet ruleSet);
}

package io.chesstopia.backend.game.application.port.out;

import io.chesstopia.backend.game.domain.GameOutcome;
import io.chesstopia.backend.game.domain.Move;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.RuleSet;
import java.util.List;

/**
 * Vom Chess-Engine-Adapter implementiert: Verwaltet Schachregeln und validiert Züge.
 */
public interface ChessEngine {
    Position initialPosition(RuleSet ruleSet);
    boolean isLegal(Position position, Move move, RuleSet ruleSet);
    Position apply(Position position, Move move, RuleSet ruleSet);

    /** Zustand der Partie nach der letzten Stellung in {@code history} (erstes Element = Anfangsstellung). */
    GameOutcome outcome(List<Position> history, RuleSet ruleSet);
}

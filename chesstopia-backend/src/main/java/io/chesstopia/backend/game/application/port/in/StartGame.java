package io.chesstopia.backend.game.application.port.in;

import io.chesstopia.backend.game.domain.GameId;
import io.chesstopia.backend.game.domain.RuleSet;

/**
 * Vom Web-Adapter aufgerufen: Startet eine neue Partie.
 */
public interface StartGame {
    GameId start(RuleSet ruleSet);
}

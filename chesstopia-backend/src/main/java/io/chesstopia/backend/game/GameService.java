package io.chesstopia.backend.game;

import io.chesstopia.backend.error.NotFoundException;
import io.chesstopia.engine.ChessEngineKt;
import io.chesstopia.engine.RuleSet;
import io.chesstopia.engine.Variant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Die einzige Stelle im Backend, die die Schach-Engine ruft.
 *
 * Zuglogik entsteht hier nicht und darf hier nicht entstehen (Verbot 3):
 * {@code validateMove} entscheidet, ob der Zug ausführbar ist,
 * {@code applyMove} erzeugt die neue Stellung. Was dieser Service beisteuert,
 * ist ausschließlich Buchführung — laden, anhängen, speichern.
 */
@Service
class GameService {

    private static final String INITIAL_FEN =
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    private final PartieRepository partieRepository;
    private final ZugRepository zugRepository;

    GameService(PartieRepository partieRepository, ZugRepository zugRepository) {
        this.partieRepository = partieRepository;
        this.zugRepository = zugRepository;
    }

    @Transactional
    GameSnapshot createGame() {
        var partie = partieRepository.save(
                new Partie(INITIAL_FEN, Variant.STANDARD, OffsetDateTime.now()));
        return GameSnapshot.of(partie, 0);
    }

    @Transactional(readOnly = true)
    GameSnapshot getGame(UUID gameId) {
        var partie = load(gameId);
        return GameSnapshot.of(partie, zugRepository.countByPartieId(gameId));
    }

    @Transactional(readOnly = true)
    List<Zug> getMoves(UUID gameId) {
        load(gameId);
        return zugRepository.findByPartieIdOrderByMoveNumberAsc(gameId);
    }

    @Transactional
    GameSnapshot playMove(UUID gameId, String uci) {
        var partie = load(gameId);
        if (partie.getStatus() == PartieStatus.COMPLETED) {
            throw new IllegalArgumentException("Die Partie %s ist bereits beendet".formatted(gameId));
        }
        var ruleSet = new RuleSet(partie.getVariant(), true, true);

        if (!ChessEngineKt.validateMove(partie.getCurrentFen(), uci, ruleSet)) {
            throw new IllegalArgumentException(
                    "Der Zug '%s' ist in dieser Stellung nicht ausführbar".formatted(uci));
        }

        var now = OffsetDateTime.now();
        var fenAfter = ChessEngineKt.applyMove(partie.getCurrentFen(), uci, ruleSet);
        var moveNumber = zugRepository.countByPartieId(gameId) + 1;
        var legalMovesAfter = ChessEngineKt.getLegalMoves(fenAfter, ruleSet);
        var statusAfter = legalMovesAfter.isCheckmate() || legalMovesAfter.isStalemate() || legalMovesAfter.isFiftyMoveDraw()
                ? PartieStatus.COMPLETED
                : PartieStatus.ONGOING;

        zugRepository.save(new Zug(partie, moveNumber, uci, fenAfter, now));
        partie.advanceTo(fenAfter, statusAfter, now);

        return GameSnapshot.of(partie, moveNumber);
    }

    private Partie load(UUID gameId) {
        return partieRepository.findById(gameId)
                .orElseThrow(() -> new NotFoundException("Partie %s existiert nicht".formatted(gameId)));
    }
}

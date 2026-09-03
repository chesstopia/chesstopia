package io.chesstopia.backend.game.adapter.out.persistence;

import io.chesstopia.backend.game.adapter.out.persistence.entities.PartieEntity;
import io.chesstopia.backend.game.adapter.out.persistence.entities.PartieJpaRepository;
import io.chesstopia.backend.game.adapter.out.persistence.entities.ZugEntity;
import io.chesstopia.backend.game.adapter.out.persistence.entities.ZugJpaRepository;
import io.chesstopia.backend.game.adapter.out.persistence.mapper.GameEntityMapper;
import io.chesstopia.backend.game.adapter.out.persistence.mapper.PositionJsonMapper;
import io.chesstopia.backend.game.application.port.out.Games;
import io.chesstopia.backend.game.domain.Game;
import io.chesstopia.backend.game.domain.GameId;
import io.chesstopia.backend.game.domain.Ply;
import io.chesstopia.backend.game.domain.Position;
import io.chesstopia.backend.game.domain.RuleSet;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementiert den {@link Games}-Port über JPA. Der {@code partie}-Snapshot wird
 * bei jedem {@code save} überschrieben, der {@code zug}-Strom ist append-only:
 * eine bestehende Zeile wird nie geändert, nur fehlende {@link Ply} werden angefügt.
 *
 * Bewusst <b>nicht</b> {@code @Transactional} — die Transaktionsgrenze zieht der
 * {@code GameService}.
 */
@Component
class GamePersistenceAdapter implements Games {

    private final PartieJpaRepository partieRepo;
    private final ZugJpaRepository zugRepo;
    private final GameEntityMapper entityMapper;
    private final PositionJsonMapper positionJsonMapper;

    GamePersistenceAdapter(PartieJpaRepository partieRepo,
                           ZugJpaRepository zugRepo,
                           GameEntityMapper entityMapper,
                           PositionJsonMapper positionJsonMapper) {
        this.partieRepo = partieRepo;
        this.zugRepo = zugRepo;
        this.entityMapper = entityMapper;
        this.positionJsonMapper = positionJsonMapper;
    }

    @Override
    public Game save(Game game) {
        UUID pid = game.id().value();

        PartieEntity pe = partieRepo.findById(pid).orElseGet(PartieEntity::new);
        if (pe.getId() == null) {
            pe.setId(pid);
            pe.setCreatedAt(game.createdAt());
        }
        RuleSet rules = game.ruleSet();
        pe.setVariant(rules.variant());
        pe.setEnPassantEnabled(rules.enPassantEnabled());
        pe.setCastlingEnabled(rules.castlingEnabled());
        pe.setStatus(game.status());
        pe.setPositionSnapshot(positionJsonMapper.toJson(game.currentPosition()));
        pe.setUpdatedAt(game.updatedAt());
        partieRepo.save(pe);

        int existing = zugRepo.countByPartieId(pid);
        for (Ply p : game.history()) {
            if (p.number() > existing) {
                ZugEntity ze = entityMapper.toEntity(p);
                ze.setId(UUID.randomUUID());
                ze.setPartieId(pid);
                zugRepo.save(ze);
            }
        }

        return game;
    }

    @Override
    public Optional<Game> findById(GameId id) {
        return partieRepo.findById(id.value())
            .map(pe -> toGame(pe, zugRepo.findByPartieIdOrderByMoveNumberAsc(id.value())));
    }

    private Game toGame(PartieEntity pe, List<ZugEntity> zuege) {
        RuleSet rules = new RuleSet(pe.getVariant(), pe.isEnPassantEnabled(), pe.isCastlingEnabled());
        List<Ply> history = zuege.stream().map(entityMapper::toPly).toList();
        Position current = positionJsonMapper.toDomain(pe.getPositionSnapshot());
        return new Game(new GameId(pe.getId()), rules, current, history,
            pe.getStatus(), pe.getCreatedAt(), pe.getUpdatedAt());
    }
}

package io.chesstopia.backend.game.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

interface ZugJpaRepository extends JpaRepository<ZugEntity, UUID> {

    List<ZugEntity> findByPartieIdOrderByMoveNumberAsc(UUID partieId);

    int countByPartieId(UUID partieId);
}

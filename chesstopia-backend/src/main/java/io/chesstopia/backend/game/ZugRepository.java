package io.chesstopia.backend.game;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

interface ZugRepository extends JpaRepository<Zug, UUID> {

    List<Zug> findByPartieIdOrderByMoveNumberAsc(UUID partieId);

    int countByPartieId(UUID partieId);
}

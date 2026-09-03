package io.chesstopia.backend.game.adapter.out.persistence.entities;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PartieJpaRepository extends JpaRepository<PartieEntity, UUID> {
}

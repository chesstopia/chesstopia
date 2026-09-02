package io.chesstopia.backend.game.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

interface PartieJpaRepository extends JpaRepository<PartieEntity, UUID> {
}

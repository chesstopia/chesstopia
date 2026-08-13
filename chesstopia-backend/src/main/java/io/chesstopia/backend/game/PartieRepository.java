package io.chesstopia.backend.game;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

interface PartieRepository extends JpaRepository<Partie, UUID> {}

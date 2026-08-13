package io.chesstopia.backend.game;

import io.chesstopia.engine.Variant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Eine Partie zwischen zwei Spielern (docs/context.md).
 *
 * Spieler fehlen noch — es gibt keine Nutzer. {@code current_fen} ist der
 * materialisierte Snapshot aus ADR-0003: die aktuelle Stellung, ohne den
 * Zugstrom abspielen zu müssen.
 *
 * {@link Variant} kommt aus der Engine und wird nicht im Backend nachgebaut.
 * Welche Varianten es gibt, ist Schachwissen und gehört dorthin.
 */
@Entity
@Table(name = "partie")
class Partie {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "current_fen", nullable = false)
    private String currentFen;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PartieStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Variant variant;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Partie() {}

    Partie(String currentFen, Variant variant, OffsetDateTime now) {
        this.currentFen = currentFen;
        this.status = PartieStatus.ONGOING;
        this.variant = variant;
        this.createdAt = now;
        this.updatedAt = now;
    }

    UUID getId() { return id; }

    String getCurrentFen() { return currentFen; }

    PartieStatus getStatus() { return status; }

    Variant getVariant() { return variant; }

    void advanceTo(String fen, PartieStatus status, OffsetDateTime now) {
        this.currentFen = fen;
        this.status = status;
        this.updatedAt = now;
    }
}

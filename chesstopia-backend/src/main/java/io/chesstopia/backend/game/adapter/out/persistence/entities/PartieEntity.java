package io.chesstopia.backend.game.adapter.out.persistence.entities;

import io.chesstopia.backend.game.domain.GameStatus;
import io.chesstopia.backend.game.domain.Variant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * JPA-Abbild der Tabelle {@code partie}: der materialisierte Snapshot der
 * aktuellen Stellung als JSONB, ohne Replay, ohne FEN.
 */
@Entity
@Table(name = "partie")
public class PartieEntity {

    @Id
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Variant variant;

    @Column(name = "en_passant_enabled", nullable = false)
    private boolean enPassantEnabled;

    @Column(name = "castling_enabled", nullable = false)
    private boolean castlingEnabled;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GameStatus status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "position_snapshot", nullable = false, columnDefinition = "jsonb")
    private PositionJson positionSnapshot;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public PartieEntity() {}

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Variant getVariant() {
        return variant;
    }

    public void setVariant(Variant variant) {
        this.variant = variant;
    }

    public boolean isEnPassantEnabled() {
        return enPassantEnabled;
    }

    public void setEnPassantEnabled(boolean enPassantEnabled) {
        this.enPassantEnabled = enPassantEnabled;
    }

    public boolean isCastlingEnabled() {
        return castlingEnabled;
    }

    public void setCastlingEnabled(boolean castlingEnabled) {
        this.castlingEnabled = castlingEnabled;
    }

    public GameStatus getStatus() {
        return status;
    }

    public void setStatus(GameStatus status) {
        this.status = status;
    }

    public PositionJson getPositionSnapshot() {
        return positionSnapshot;
    }

    public void setPositionSnapshot(PositionJson positionSnapshot) {
        this.positionSnapshot = positionSnapshot;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

package io.chesstopia.backend.game.adapter.out.persistence;

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
class PartieEntity {

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

    protected PartieEntity() {}

    UUID getId() {
        return id;
    }

    void setId(UUID id) {
        this.id = id;
    }

    Variant getVariant() {
        return variant;
    }

    void setVariant(Variant variant) {
        this.variant = variant;
    }

    boolean isEnPassantEnabled() {
        return enPassantEnabled;
    }

    void setEnPassantEnabled(boolean enPassantEnabled) {
        this.enPassantEnabled = enPassantEnabled;
    }

    boolean isCastlingEnabled() {
        return castlingEnabled;
    }

    void setCastlingEnabled(boolean castlingEnabled) {
        this.castlingEnabled = castlingEnabled;
    }

    GameStatus getStatus() {
        return status;
    }

    void setStatus(GameStatus status) {
        this.status = status;
    }

    PositionJson getPositionSnapshot() {
        return positionSnapshot;
    }

    void setPositionSnapshot(PositionJson positionSnapshot) {
        this.positionSnapshot = positionSnapshot;
    }

    OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

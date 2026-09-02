package io.chesstopia.backend.game.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * JPA-Abbild der Tabelle {@code zug}: ein Ereignis im Zugstrom einer Partie.
 * Append-only — eine bestehende Zeile wird nie aktualisiert. Die Zuordnung zur
 * Partie führt der Adapter über {@code partieId}, kein {@code @ManyToOne}.
 */
@Entity
@Table(name = "zug")
class ZugEntity {

    @Id
    private UUID id;

    @Column(name = "partie_id", nullable = false)
    private UUID partieId;

    @Column(name = "move_number", nullable = false)
    private int moveNumber;

    @Column(name = "from_square", nullable = false)
    private String fromSquare;

    @Column(name = "to_square", nullable = false)
    private String toSquare;

    @Column(name = "promotion")
    private String promotion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "position_after", nullable = false, columnDefinition = "jsonb")
    private PositionJson positionAfter;

    @Column(name = "played_at", nullable = false)
    private OffsetDateTime playedAt;

    @Column(name = "time_spent_ms")
    private Long timeSpentMs;

    protected ZugEntity() {}

    UUID getId() {
        return id;
    }

    void setId(UUID id) {
        this.id = id;
    }

    UUID getPartieId() {
        return partieId;
    }

    void setPartieId(UUID partieId) {
        this.partieId = partieId;
    }

    int getMoveNumber() {
        return moveNumber;
    }

    void setMoveNumber(int moveNumber) {
        this.moveNumber = moveNumber;
    }

    String getFromSquare() {
        return fromSquare;
    }

    void setFromSquare(String fromSquare) {
        this.fromSquare = fromSquare;
    }

    String getToSquare() {
        return toSquare;
    }

    void setToSquare(String toSquare) {
        this.toSquare = toSquare;
    }

    String getPromotion() {
        return promotion;
    }

    void setPromotion(String promotion) {
        this.promotion = promotion;
    }

    PositionJson getPositionAfter() {
        return positionAfter;
    }

    void setPositionAfter(PositionJson positionAfter) {
        this.positionAfter = positionAfter;
    }

    OffsetDateTime getPlayedAt() {
        return playedAt;
    }

    void setPlayedAt(OffsetDateTime playedAt) {
        this.playedAt = playedAt;
    }

    Long getTimeSpentMs() {
        return timeSpentMs;
    }

    void setTimeSpentMs(Long timeSpentMs) {
        this.timeSpentMs = timeSpentMs;
    }
}

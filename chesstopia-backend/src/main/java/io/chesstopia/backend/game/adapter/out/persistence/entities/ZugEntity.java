package io.chesstopia.backend.game.adapter.out.persistence.entities;

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
public class ZugEntity {

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

    public ZugEntity() {}

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getPartieId() {
        return partieId;
    }

    public void setPartieId(UUID partieId) {
        this.partieId = partieId;
    }

    public int getMoveNumber() {
        return moveNumber;
    }

    public void setMoveNumber(int moveNumber) {
        this.moveNumber = moveNumber;
    }

    public String getFromSquare() {
        return fromSquare;
    }

    public void setFromSquare(String fromSquare) {
        this.fromSquare = fromSquare;
    }

    public String getToSquare() {
        return toSquare;
    }

    public void setToSquare(String toSquare) {
        this.toSquare = toSquare;
    }

    public String getPromotion() {
        return promotion;
    }

    public void setPromotion(String promotion) {
        this.promotion = promotion;
    }

    public PositionJson getPositionAfter() {
        return positionAfter;
    }

    public void setPositionAfter(PositionJson positionAfter) {
        this.positionAfter = positionAfter;
    }

    public OffsetDateTime getPlayedAt() {
        return playedAt;
    }

    public void setPlayedAt(OffsetDateTime playedAt) {
        this.playedAt = playedAt;
    }

    public Long getTimeSpentMs() {
        return timeSpentMs;
    }

    public void setTimeSpentMs(Long timeSpentMs) {
        this.timeSpentMs = timeSpentMs;
    }
}

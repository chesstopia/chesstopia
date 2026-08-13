package io.chesstopia.backend.game;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Ein Halbzug innerhalb einer Partie, als unveränderlicher Ereignissatz
 * (docs/context.md, ADR-0003).
 *
 * Es gibt keinen Setter: Ein Zug wird gespielt, nicht bearbeitet. Wer ihn
 * ändern wollte, änderte die Geschichte der Partie — und genau dagegen ist ein
 * Ereignisstrom gebaut.
 */
@Entity
@Table(name = "zug")
class Zug {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "partie_id", nullable = false)
    private Partie partie;

    @Column(name = "move_number", nullable = false)
    private int moveNumber;

    @Column(nullable = false)
    private String uci;

    @Column(name = "fen_after", nullable = false)
    private String fenAfter;

    @Column(name = "played_at", nullable = false)
    private OffsetDateTime playedAt;

    /** Noch niemand misst die Bedenkzeit — die Spalte wartet auf die Zeitkontrolle. */
    @Column(name = "time_spent_ms")
    private Long timeSpentMs;

    protected Zug() {}

    Zug(Partie partie, int moveNumber, String uci, String fenAfter, OffsetDateTime playedAt) {
        this.partie = partie;
        this.moveNumber = moveNumber;
        this.uci = uci;
        this.fenAfter = fenAfter;
        this.playedAt = playedAt;
    }

    int getMoveNumber() { return moveNumber; }

    String getUci() { return uci; }

    String getFenAfter() { return fenAfter; }

    OffsetDateTime getPlayedAt() { return playedAt; }
}

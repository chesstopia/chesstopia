-- Move-Event-Log als Persistenzmodell für Partien (ADR-0003, präzisiert durch ADR-0020).
--
-- `partie.position_snapshot` ist der materialisierte Snapshot der aktuellen Stellung
-- als JSONB des Domänen-Objekts — lesbar per SELECT, ohne Replay, ohne FEN.
-- `zug` ist der Ereignisstrom: der Zug als lesbare Felder plus die Stellung danach.
--
-- Was ADR-0003 zusätzlich beschließt und hier fehlt, fehlt weiter absichtlich
-- (kein Schreiber): centipawn_loss/move_classification (MoveEngine), eco_code und
-- Rating-Snapshots (Nutzer + RatingSystem).

CREATE TABLE partie (
    id                  UUID        PRIMARY KEY,
    variant             VARCHAR(32) NOT NULL,
    en_passant_enabled  BOOLEAN     NOT NULL,
    castling_enabled    BOOLEAN     NOT NULL,
    status              VARCHAR(16) NOT NULL,
    position_snapshot   JSONB       NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL
);

CREATE TABLE zug (
    id             UUID        PRIMARY KEY,
    partie_id      UUID        NOT NULL REFERENCES partie (id) ON DELETE CASCADE,
    move_number    INTEGER     NOT NULL,
    from_square    VARCHAR(2)  NOT NULL,
    to_square      VARCHAR(2)  NOT NULL,
    promotion      VARCHAR(6),
    position_after JSONB       NOT NULL,
    played_at      TIMESTAMPTZ NOT NULL,
    time_spent_ms  BIGINT,

    -- Ein Ereignisstrom mit Lücke oder Dopplung ist keiner. Erzeugt zugleich den
    -- Index, über den die Historie gelesen wird.
    CONSTRAINT zug_reihenfolge UNIQUE (partie_id, move_number)
);

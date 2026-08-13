-- Move-Event-Log als Persistenzmodell für Partien (ADR-0003).
--
-- `partie.current_fen` ist der materialisierte Snapshot: die aktuelle Stellung
-- ohne Replay lesbar. `zug` ist der Ereignisstrom, aus dem sich jede frühere
-- Stellung und ein PGN-Export rekonstruieren lassen.
--
-- Was ADR-0003 zusätzlich beschließt und hier fehlt, fehlt absichtlich: Es hat
-- heute keinen Schreiber. `san_notation` braucht Zugerzeugung zur
-- Disambiguierung (CHESS-2), `centipawn_loss` und `move_classification`
-- brauchen die MoveEngine, `eco_code` und die Rating-Snapshots brauchen Nutzer
-- und das RatingSystem — alle drei stehen auf `implementation: planned`. Eine
-- Spalte, die niemand füllt, ist kein Schema, sondern eine Behauptung.

CREATE TABLE partie (
    id          UUID        PRIMARY KEY,
    current_fen TEXT        NOT NULL,
    status      VARCHAR(16) NOT NULL,
    variant     VARCHAR(32) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE zug (
    id            UUID        PRIMARY KEY,
    partie_id     UUID        NOT NULL REFERENCES partie (id) ON DELETE CASCADE,
    move_number   INTEGER     NOT NULL,
    uci           VARCHAR(5)  NOT NULL,
    fen_after     TEXT        NOT NULL,
    played_at     TIMESTAMPTZ NOT NULL,
    time_spent_ms BIGINT,

    -- Ein Ereignisstrom mit Lücke oder Dopplung ist keiner. Die Bedingung
    -- erzeugt zugleich den Index, über den die Historie gelesen wird.
    CONSTRAINT zug_reihenfolge UNIQUE (partie_id, move_number)
);

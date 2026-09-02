---
type: adr
status: partially-superseded
implementation: partial
updated: 2026-08-10
supersedes: []
verifies:
  - 'chesstopia-backend/src/main/resources/db/migration/V2__create_partie_und_zug.sql :: CREATE TABLE zug'
  - 'chesstopia-backend/src/main/resources/db/migration/V2__create_partie_und_zug.sql :: position_snapshot'
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/game/adapter/out/persistence/PartieEntity.java :: position_snapshot'
---

# ADR-0003: Move-Event-Log als Persistenzmodell für Partien

## Status
Accepted

Partially superseded by [ADR-0020](0020-hexagonale-architektur-und-notationsfreie-domaene.md): Ereignisstrom + materialisierter Snapshot gelten weiter. Das Snapshot-Format ist JSONB des Domänen-`Position`-Objekts, nicht FEN; ein Zug wird als `from_square`/`to_square`/`promotion` + `position_after` gespeichert, nicht als `uci`/`fen_after`.

## Context
Partien müssen gespeichert, abgespielt, analysiert und für Statistiken ausgewertet werden. Die Frage ist wie Spielzustand und Zughistorie in PostgreSQL abgelegt werden.

Alternativen:
- Nur aktuelle Stellung (FEN): Replay unmöglich.
- PGN als Text-BLOB: kaum querybar, Statistiken nur über Parsing erreichbar.
- Move-Event-Log: jeder Zug als eigener Datensatz.
- Move-Event-Log + materialisierter Snapshot der aktuellen Stellung.

## Decision
Jede `Partie` hält eine `current_fen`-Spalte (immer aktuell, sofort lesbar ohne Replay). Jeder `Zug` ist ein eigener Datensatz mit:
- `move_number`, `san_notation`, `fen_after`
- `played_at` (Timestamp)
- `time_spent_ms`
- Nach Engine-Analyse: `centipawn_loss`, `move_classification` (BEST / EXCELLENT / GOOD / INACCURACY / MISTAKE / BLUNDER)

Außerdem speichert `Partie`:
- `analysis_status` (PENDING / COMPLETED / SKIPPED)
- `eco_code` (Eröffnungsklassifikation, nach den ersten ~10 Zügen gesetzt)
- Rating-Snapshots beider Spieler **zum Zeitpunkt der Partie** (nicht das aktuelle Rating)

PGN kann jederzeit aus dem Move-Event-Log generiert werden (Export).

## Consequences
- Replay, Stellungsrekonstruktion und PGN-Export sind trivial.
- Statistiken (Fehlerquoten, Eröffnungsperformance, Zugzeit) sind direkt über SQL abfragbar.
- Trainingspositionen können automatisch aus analysierten Partien extrahiert werden.
- Speicherbedarf ist höher als ein PGN-BLOB, aber für relationale Queries unerlässlich.
- Rating-Snapshots ermöglichen historisch korrekte Statistiken auch wenn sich das Rating des Nutzers später verändert.

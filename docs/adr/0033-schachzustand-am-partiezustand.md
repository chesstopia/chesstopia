---
type: adr
status: accepted
implementation: complete
updated: 2026-10-31
supersedes: []
verifies:
  - 'docs/api/openapi.yaml :: enum: [NO_CHECK, CHECK_WHITE, CHECK_BLACK]'
  - 'chess-engine/src/commonMain/kotlin/io/chesstopia/engine/ChessEngine.kt :: fun checkState(position: Position): CheckState'
  - "chesstopia-backend/src/main/resources/db/migration/V5__partie_check_state.sql :: NOT NULL DEFAULT 'NO_CHECK'"
---

# ADR-0033: Schachzustand am Partiezustand, von der Engine geliefert

## Status
Accepted

## Context
CHESS-29 macht Schach und Schachmatt auf der Partieseite sichtbar und hörbar: Rahmen um den König im Schach, „Schach“-Marke in der Spielerzeile, eigener Ton. Bis dahin kennt der Kontrakt nur `status` und `endReason` — „Schach ohne Matt“ verlässt die Engine nicht. Die Engine prüft Schach intern (`Position.isCheck()` in `Outcome.kt`), um Matt und Patt zu unterscheiden.

Stellungen liegen im Backend als JSON (`PositionJson`) im Partie-Snapshot und append-only im Zugstrom (`zug`, [ADR-0003](0003-move-event-log.md)); Partiezustand wie `status` und `end_reason` liegt als eigene Spalte in `partie`. Es gibt bereits gespeicherte Partien.

Die erste Umsetzung berechnete Schach im Frontend über einen Engine-Export `isInCheck`; im Laufe von CHESS-29 fiel die Entscheidung, die Information in den Kontrakt zu nehmen.

## Considered Options
- **Berechnung im Frontend über einen Engine-Export (`isInCheck`)** — kein Kontraktwechsel, aber jeder Konsument müsste die Engine selbst fragen; der Kontrakt beschriebe den Zustand einer Partie unvollständig.
- **`inCheck: boolean` an der `Position`** — hätte jede gespeicherte Stellung (Snapshot und append-only Zugstrom) betroffen; alte Stellungen tragen das Feld nicht und bräuchten Reparatur. Ein Boolean sagt außerdem nicht, *wer* im Schach steht.
- **Reparatur alter Daten beim Lesen** (fehlender Wert → Engine fragen) — hätte den Persistenz-Adapter vom Engine-Port abhängig gemacht und das Wissen über alte Datenformate dauerhaft im Code gehalten.
- **Optionales/nullables Feld** — jeder Konsument müsste „unbekannt“ behandeln, obwohl der Unterschied zu „kein Schach“ für niemanden zählt.
- **Interpretation im Service** (Engine liefert Boolean, Service leitet die Seite aus `sideToMove` ab) — legt eine Regelableitung ins Backend, gegen Verbot 3.

## Decision
`GameResponse` und `GameCreatedResponse` tragen das Pflichtfeld `checkState` mit `NO_CHECK | CHECK_WHITE | CHECK_BLACK`, parallel zu `status`. Im Matt nennt es den mattgesetzten König, im Patt `NO_CHECK`.

Die Engine liefert das Enum fertig: `@JsExport fun checkState(position: Position): CheckState`. Der `ChessEngine`-Port reicht es durch, der `GameService` setzt es bei jedem Zug am `Game`, `Game.start` beginnt mit `NO_CHECK`.

Gespeichert wird es als Spalte `partie.check_state` (`NOT NULL DEFAULT 'NO_CHECK'`, Flyway `V5`). Alte Daten werden nicht repariert: Eine Partie, die beim Einspielen von V5 gerade im Schach steht, meldet `NO_CHECK` bis zu ihrem nächsten Zug.

## Consequences
- Der Kontrakt beschreibt den Partiezustand vollständig; Frontend, WebSocket-Broadcast und künftige Clients brauchen für Schach keine Engine.
- Der Zugstrom (`zug`) kennt den Schachzustand je Halbzug nicht. Wer ihn für die Historie braucht (z. B. „+“ in einer Notation), berechnet ihn aus `positionAfter` über die Engine — nicht durch nachträgliches Beschreiben alter `zug`-Zeilen.
- Altpartien zeigen bis zu ihrem nächsten Zug kein Schach — bewusst hingenommen.
- Kein Code darf aus `sideToMove` und einem Boolean ableiten, wer im Schach steht; die Seite kommt aus `checkState`.

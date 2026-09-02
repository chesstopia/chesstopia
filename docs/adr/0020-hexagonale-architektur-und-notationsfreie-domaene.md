---
type: adr
status: accepted
implementation: partial
updated: 2026-09-02
supersedes: ['0013']
verifies:
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/game/adapter/out/engine/ChessRulesAdapter.java :: implements ChessRules'
  - 'docs/api/openapi.yaml :: PlacedPiece'
---

# ADR-0020: Hexagonale Architektur im game-Feature und eine notationsfreie Domäne

## Status
Accepted

## Context

Der Commit `d0ca0c8` (CHESS-13) fädelte FEN und UCI ungebrochen durch jede Schicht: von der Datenbankspalte über die JPA-Entity, den Service und den Controller bis in `GameResponse.fen` und das Frontend, wo `parseFenBoard` die Zeichenkette wieder zerlegte. Die Domäne trug damit Notation, die an jeder Station neu interpretiert werden musste, und ein Formatfehler im FEN-String fiel erst zur Laufzeit auf.

Die Engine ist nach [ADR-0001](0001-kotlin-multiplatform-chess-engine.md) die autoritative Regelimplementierung. An ihrer Grenze spricht sie FEN und UCI — das ist ihr Austauschformat, nicht das Vokabular einer Java-Domäne. Zum Entscheidungszeitpunkt war die Regellogik selbst noch ein `TODO`: die Engine lieferte Struktur, keine Legalitätsprüfung.

## Considered Options

- **Shared Kernel** — die Engine definiert das Vokabular, Backend und Frontend konsumieren es gemeinsam. Verworfen: die `@JsExport`-Typen sind für JS-Interop geformt (`Array` statt `List`, [ADR-0007](0007-jsexport-in-commonmain.md)) und passen schlecht auf eine Java-Domäne; die Domäne hinge zudem an der Engine-Bibliothek.
- **Formlose Übersetzungsschicht im Service** statt eines benannten Ports. Verworfen: kein Mock-Punkt, das Aggregat wäre nur mit der TODO-lastigen Engine testbar.
- **Strikt getrennte Domäne, ein `ChessRules`-Out-Port und `ChessRulesAdapter` als einzige Anti-Corruption-Layer** — gewählt.

## Decision

Das `game`-Feature wird hexagonal geschnitten: `domain`, `application` mit `port/in` und `port/out`, `adapter` — innerhalb der bestehenden Package-by-Feature-Struktur. `counter` und `hello` bleiben klassisch geschichtet.

Die Domäne kennt keine FEN, UCI oder SAN. Sie arbeitet mit `Position`, `Move`, `Square(File, Rank)` und `Piece(PieceType, Color)`. FEN verschwindet aus der `@JsExport`-Grenze der Engine, die nun strukturierte `Position` und `Move` trägt, aus der REST-API, die ein strukturiertes Brett liefert, und aus dem Frontend. Die Persistenz speichert die Stellung als JSONB des Domänen-Objekts. Eine KMP-Hilfe `toFen` wird erst gebaut, wenn Stockfish ([ADR-0005](0005-stockfish-hybrid.md)) sie braucht — jetzt nicht.

## Consequences

- Es entstehen vier Adapter-Mapper (Engine, Persistenz, Web, JSONB). Wie sie umgesetzt werden, ist Gegenstand von [ADR-0021](0021-mapstruct-fuer-adapter-mappings.md).
- Die Domäne baut und testet ohne jede Änderung an der Engine.
- [ADR-0013](0013-package-by-feature-backend.md) („kein Hexagonal") ist abgelöst; [ADR-0001](0001-kotlin-multiplatform-chess-engine.md), [ADR-0003](0003-move-event-log.md) und [ADR-0007](0007-jsexport-in-commonmain.md) sind teilweise abgelöst — welcher Teil, steht in deren `## Status`.
- Neue Features entscheiden pro Fall, ob sie hexagonal werden. Der bewiesene Schnitt ist `game`, kein Mandat für das ganze Backend.
- Die vier Adapter-Mapper müssen mit dem Kontrakt und dem Schema synchron gehalten werden; ihre Umsetzung regelt [ADR-0021](0021-mapstruct-fuer-adapter-mappings.md).

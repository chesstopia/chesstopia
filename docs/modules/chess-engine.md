---
type: module
name: chess-engine
status: active
updated: 2026-09-04
adrs: [0001, 0007, 0020, 0022]
verifies:
  - 'chess-engine/src/commonMain/kotlin/io/chesstopia/engine/ChessEngine.kt :: fun validateMove'
  - 'chess-engine/src/commonMain/kotlin/io/chesstopia/engine/Position.kt :: val board: Array<PlacedPiece>'
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/game/adapter/out/engine/ChessEngineAdapter.java :: ChessEngineKt.applyMove'
  - 'chesstopia-frontend/src/lib/engine.ts :: validateMove'
---

# chess-engine

## Zweck

Die einzige autoritative Implementierung der Schachregeln im Projekt. Kotlin Multiplatform, kompiliert nach JVM (Jar) und JS/ESM aus derselben Quelle ([ADR-0001](../adr/0001-kotlin-multiplatform-chess-engine.md)) — Backend und Frontend prüfen gegen dasselbe Regelwerk, statt es zweimal zu schreiben und synchron zu halten.

## Gehört hierher

Zuglogik, Legalitätsprüfung, Schach-/Matt-/Patt-Erkennung, Remis-Regeln (50 Züge, ungenügendes Material, Dreifachwiederholung), Sonderregeln (Rochade, En passant, Promotion) — alles, was eine Stellung bewertet oder fortschreibt.

## Gehört NICHT hierher

**Schachregeln im Backend oder Frontend.** Ein zweiter Regelast außerhalb dieses Moduls widerspricht CLAUDE.md Verbot 3 und dem Grund, warum das Modul existiert.

**FEN/UCI an der `@JsExport`-Grenze.** Die Grenze trägt strukturierte Objekte (`Position`, `Move`, `Piece`, `Square`), keine Notation ([ADR-0020](../adr/0020-hexagonale-architektur-und-notationsfreie-domaene.md)). FEN ist derzeit nicht in Gebrauch; eine `toFen`-Hilfe entsteht erst mit dem künftigen Stockfish-Adapter, und dann in der Engine.

## Invarianten

1. **`@JsExport` steht in `commonMain`** ([ADR-0007](../adr/0007-jsexport-in-commonmain.md)) — kein separater `jsMain`-Exportpfad.
2. **Exportierte Sammlungen sind `Array<T>`, nicht `List<T>`** (z. B. `Position.board`, `LegalMovesResult.moves`) — sauberer JS-Interop. Java-seitige Weiterverwendung konvertiert mit `.toList()` direkt am Aufruf, ausschließlich im `ChessEngineAdapter`.
3. **Die Engine ist zustandsfrei pro Aufruf.** Jede Funktion nimmt eine `Position` (und ggf. Historie) entgegen und gibt eine neue zurück; kein interner Zustand zwischen Aufrufen.
4. **Notationsfrei.** Keine FEN/UCI-Strings in Domäne oder API der Engine.
5. **`getLegalMoves` wirft an der `@JsExport`-Grenze weiterhin `NotImplementedError`** — der Aufruf ist exportiert, aber (Stand CHESS-9) nicht an den internen Generator angeschlossen.

## Einstiegspunkte

| Frage | Datei |
|---|---|
| Wie sieht eine Stellung aus? | `chess-engine/src/commonMain/kotlin/io/chesstopia/engine/Position.kt` |
| Wie wird ein Zug geprüft/ausgeführt? | `chess-engine/src/commonMain/kotlin/io/chesstopia/engine/ChessEngine.kt` |
| Wie sieht der ausführbare Testkorpus aus? | `chess-engine/testcases/` |
| Wie übersetzt das Backend? | `chesstopia-backend/.../adapter/out/engine/ChessEngineAdapter.java` |
| Wie übersetzt das Frontend? | `chesstopia-frontend/src/lib/engine.ts` |

## Wellenwirkung

Seit CHESS-9 hat das Modul **zwei reale Konsumenten**: den `ChessEngineAdapter` im Backend und `chesstopia-frontend/src/lib/engine.ts` im Frontend ([frontend-engine-validierung.md](../notes/frontend-engine-validierung.md)). Eine Regeländerung bewegt beide — nicht mehr nur den Backend-Adapter. Der Perft-Korpus (`PerftTest.kt`, Referenz-Knotenzahlen) ist die Gegenprobe: Er fängt Zugerzeugungs-Fehler ab, die ein einzelner Fall im `testcases/`-Korpus übersehen würde.

Eine geänderte exportierte Signatur (Typname, Feldname, `Array` statt `List`) bricht beide Adapter gleichzeitig — MapStruct/handgeschriebene Übersetzung auf der Backend-Seite, die Interop-Funktionen in `engine.ts` auf der Frontend-Seite.

## Abhängigkeiten

- `chesstopia-backend` → JVM-Jar via `includeBuild("chess-engine")`, übersetzt im `ChessEngineAdapter`.
- `chesstopia-frontend` → JS/ESM-Paket `@chesstopia/chess-engine`, übersetzt in `src/lib/engine.ts`.
- Build-Reihenfolge → [build-orchestrierung.md](build-orchestrierung.md).

## Zugehörige Entscheidungen

- [ADR-0001](../adr/0001-kotlin-multiplatform-chess-engine.md) — warum Kotlin Multiplatform statt zwei Implementierungen
- [ADR-0007](../adr/0007-jsexport-in-commonmain.md) — warum `@JsExport` in `commonMain`
- [ADR-0020](../adr/0020-hexagonale-architektur-und-notationsfreie-domaene.md) — warum strukturierte Objekte statt FEN an der Grenze
- [ADR-0022](../adr/0022-datei-getriebener-engine-testkorpus.md) — warum ein datei-getriebener Testkorpus statt EPD/FEN oder Laufzeit-Dateizugriff

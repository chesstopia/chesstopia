---
type: adr
status: accepted
implementation: complete
updated: 2026-08-08
supersedes: []
verifies:
  - 'chess-engine/src/commonMain/kotlin/io/chesstopia/engine/ChessEngine.kt :: @JsExport'
---

# ADR-0007: @JsExport in commonMain — keine jsMain-Fassade

## Status
Accepted

Ergänzung ([ADR-0020](0020-hexagonale-architektur-und-notationsfreie-domaene.md)): Der `@JsExport`-Typ `Position` folgt derselben Regel — `board` ist `Array<PlacedPiece>` (nur die besetzten Felder), nicht `List` und nicht `Map`. `Map` über `@JsExport` erzeugt in der `.d.ts` einen Wrapper-Typ statt eines nativen JS-Objekts; die dünne `PlacedPiece`-Liste hat dieselbe Form wie der REST-Kontrakt und die Persistenz.

## Context
Die Schach-Engine ist ein KMP-Modul, das für JVM (Spring Boot) und JS (React) kompiliert wird.
Alle exportierten Typen (`Move`, `RuleSet`, `Variant`, `LegalMovesResult`) und Funktionen tragen
`@JsExport`-Annotationen direkt in `commonMain`. Das bedeutet: `kotlin.js.*`-Imports und
`@file:OptIn(ExperimentalJsExport::class)` stehen in commonMain-Dateien, und die API verwendet
`Array<Move>` statt `List<Move>`, weil `List` von `@JsExport` nicht direkt unterstützt wird.

Die Alternative wäre eine separate `jsMain`-Schicht: `commonMain` enthält die reine Kotlin-API
(`List<Move>`, kein `@JsExport`), `jsMain` enthält dünne Wrapper-Klassen mit `Array<Move>` und
`@JsExport`, `jvmMain` bleibt leer.

## Decision
`@JsExport` bleibt in `commonMain`. Keine `jsMain`-Fassade.

`@JsExport` in `commonMain` ist der von JetBrains empfohlene idiomatische KMP-Ansatz — die
Annotation ist auf der JVM ein No-op und erzeugt keinen Overhead. Eine Fassadenschicht würde jeden
exportierten Typ und jede Funktion verdoppeln. Solange die Engine-API klein und stabil bleibt und
`jsMain` nur eine dünne Fassade ohne eigene Logik wäre, überwiegt der Boilerplate-Aufwand den
Klarheitsgewinn deutlich. `jvmMain` würde leer bleiben, was das Muster asymmetrisch und
irreführend macht.

## Consequences
- Neue exportierte Typen brauchen `@JsExport` und `Array`-statt-`List`-Konventionen direkt in commonMain.
- Falls die JS-API irgendwann asynchron wird (Promise-Wrapping) oder sich strukturell von der JVM-API unterscheidet, ist eine `jsMain`-Schicht dann der richtige Schritt — dieser ADR ist der Startpunkt für diese Revision.

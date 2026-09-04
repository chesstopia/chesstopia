---
type: adr
status: accepted
implementation: complete
updated: 2026-09-04
supersedes: []
verifies:
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/game/application/port/out/ChessEngine.java :: outcome(List<Position>'
---

# ADR-0023: Engine-Outcome nimmt die Stellungshistorie

## Status
Accepted

## Context
„Legalität komplett inkl. Partieende" braucht die Dreifachwiederholung, und die ist keine Funktion einer einzelnen `Position` — sie braucht die Folge. [ADR-0020](0020-hexagonale-architektur-und-notationsfreie-domaene.md) hat eine notationsfreie strukturierte Grenze mit einzelnen `Position`/`Move`-Objekten etabliert. Matt/Patt/50-Züge/ungenügendes Material sind aus einer `Position` ableitbar, die Wiederholung nicht.

## Considered Options
- **Das Backend zählt Wiederholungen selbst** — Schachregeln im Backend, gegen Verbot 3 / [ADR-0001](0001-kotlin-multiplatform-chess-engine.md). „Gleiche Stellung" nach FIDE ist Figurenstand + Seite + Rochaderechte + En-passant — das ist eine Regel und gehört in die Engine.
- **Die Engine hält Partiezustand** — die Engine ist pro Aufruf bewusst zustandsfrei (ADR-0020, Testbarkeit); eine zustandstragende Engine verliert die Rein-Funktion-Eigenschaft.
- **Getrennt `threefoldRepetition(history)` exportieren + `gameOutcome(position)`** — spaltet eine Frage („welchen Zustand hat die Partie?") auf zwei Aufrufe, die der Aufrufer korrekt komponieren muss; die Reihenfolge (Matt vor Remis) läge dann beim Aufrufer.

## Decision
`gameOutcome(history: Array<Position>, ruleSet): GameOutcome` an der `@JsExport`-Grenze nimmt die volle Stellungsfolge (letztes Element = aktuell). Der `ChessEngine`-Out-Port spiegelt das als `outcome(List<Position> history, RuleSet)`. Der Backend-`GameService` baut die Liste aus `initialPosition(ruleSet)` + jedem `Ply.positionAfter` + der resultierenden Stellung.

## Consequences
- Die Engine-Grenze trägt jetzt in einer Richtung eine `Array<Position>` — die erste Sammlung als Parameter. `.toList()` auf der Java-Seite gemäß [ADR-0007](0007-jsexport-in-commonmain.md).
- `Game` (Backend) speichert die Anfangsstellung nicht; `GameService` rekonstruiert sie über `initialPosition(ruleSet)`. Für Nicht-STANDARD-Varianten (nicht im Umfang) wäre das erneut zu prüfen.
- `LegalMovesResult` / `getLegalMoves` unverändert — weiter `TODO`.

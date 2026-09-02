---
type: adr
status: superseded
implementation: complete
updated: 2026-08-08
supersedes: []
verifies:
  - 'settings.gradle.kts :: include(":chesstopia-backend")'
---

# ADR-0013: Package-by-Feature im Backend — kein Hexagonal, keine Backend-Submodule

## Status
Accepted

Superseded by [ADR-0020](0020-hexagonale-architektur-und-notationsfreie-domaene.md)

## Context

Das Backend beginnt bei null. Zwei Schnitte waren zu wählen: wie der Code innerhalb des Moduls gegliedert wird, und ob das Backend selbst in mehrere Gradle-Module zerfällt.

Beide Fragen hängen zusammen: Wer Package-by-Layer wählt, hat später keinen natürlichen Schnitt für Module; wer Hexagonal wählt, zahlt den Ports-und-Adapters-Aufwand ab dem ersten Feature.

## Considered Options

- **Package-by-Layer** (`controller`, `service`, `repository` über alle Domänen) — vertraut, macht aber Domänengrenzen unsichtbar und streut ein Feature über das ganze Modul.
- **Hexagonal / Clean Architecture** — saubere Abhängigkeitsrichtung, aber Ports-und-Adapters-Overhead für ein Team in der Frühphase; der Gewinn rechtfertigt den Aufwand nicht vor dem ersten Feature.
- **Backend in eigene Gradle-Module schneiden** (`:game`, `:rating`) — premature optimization ohne bewiesenen Schnitt.

## Decision

Package-by-Feature mit klassischer Schichtung **innerhalb** eines Features: `io.chesstopia.backend.<feature>` enthält Controller, Service, Repository und Entity dieses Features.

Das Backend bleibt ein einzelnes Gradle-Subprojekt. `chess-engine` ist bereits separiert — das ist der einzige notwendige Modulschnitt dieser Phase ([ADR-0001](0001-kotlin-multiplatform-chess-engine.md)).

## Consequences

- Ein neues Feature ist ein neues Package, kein neues Modul und kein Eintrag in `settings.gradle.kts`.
- Domänengrenzen sind an der Paketstruktur ablesbar, nicht an Modulgrenzen. Es gibt nichts, das eine Grenzverletzung erzwingend verhindert — sie bleibt eine Konvention.
- Ein späterer Modulschnitt ist möglich, aber er ist dann ein Umbau. Er soll auf einem bewiesenen Schnitt beruhen, nicht auf Vermutung.
- Querschnittliches wie `config` und `error` liegt außerhalb der Feature-Packages; das ist die bewusste Ausnahme von der Regel.

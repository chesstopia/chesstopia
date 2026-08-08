---
type: note
status: current
updated: 2026-08-08
---

# ADR-Register

Alle Architekturentscheidungen des Projekts. Ein ADR beantwortet **warum** etwas so ist — nicht, wie es heute aussieht.

| Nr. | Titel | Status |
|---|---|---|
| [0001](0001-kotlin-multiplatform-chess-engine.md) | Kotlin Multiplatform für die geteilte Schach-Validierungslogik | Accepted |
| [0002](0002-zwei-ki-abstraktionen.md) | Zwei getrennte KI-Abstraktionen — MoveEngine und ChessCoach | Accepted |
| [0003](0003-move-event-log.md) | Move-Event-Log als Persistenzmodell für Partien | Accepted |
| [0004](0004-glicko2-rating-system.md) | Glicko-2 als Rating-System (via austauschbares RatingSystem-Interface) | Accepted |
| [0005](0005-stockfish-hybrid.md) | Stockfish Hybrid — Server-Prozess für KI-Gegner, Stockfish.js für Evaluation Bar | Accepted |
| [0006](0006-build-orchestration.md) | Build-Orchestrierung — Gradle Composite Build + pnpm Workspaces + node-gradle Plugin | Accepted |
| [0007](0007-jsexport-in-commonmain.md) | @JsExport in commonMain — keine jsMain-Fassade | Accepted |
| [0008](0008-openapi-first-codegen.md) | OpenAPI-First + Code Generation — Backend Stubs und Frontend Axios Client | Accepted |
| [0009](0009-embedded-postgres-fuer-tests.md) | Zonky Embedded PostgreSQL für Tests statt H2 oder Testcontainers | Accepted ¹ |

¹ Die Datei trägt noch kein `## Status`-Feld und folgt einem abweichenden Format. Der Status ist aus dem Code belegt: Zonky ist als Abhängigkeit eingebunden und beide Testklassen nutzen `@AutoConfigureEmbeddedDatabase`.

**Keine Datumsspalte.** Kein ADR trägt ein Entscheidungsdatum im Dokument. Es aus `git log` abzuschreiben würde die History duplizieren und ab dem ersten Rebase falsch sein — die Spalte kommt, sobald die ADRs ein belastbares Datumsfeld im Frontmatter haben.

**Diese Datei wird derzeit von Hand gepflegt.** Sie soll später aus dem Frontmatter der ADRs erzeugt werden; bis dahin gilt: Ein neues ADR trägt sich hier ein.

---
type: note
status: current
updated: 2026-08-08
---

# ADR-Register

Alle Architekturentscheidungen des Projekts. Ein ADR beantwortet **warum** etwas so ist — nicht, wie es heute aussieht.

| Nr. | Titel | Status | Umsetzung |
|---|---|---|---|
| [0001](0001-kotlin-multiplatform-chess-engine.md) | Kotlin Multiplatform für die geteilte Schach-Validierungslogik | Accepted | complete |
| [0002](0002-zwei-ki-abstraktionen.md) | Zwei getrennte KI-Abstraktionen — MoveEngine und ChessCoach | Accepted | planned |
| [0003](0003-move-event-log.md) | Move-Event-Log als Persistenzmodell für Partien | Accepted | planned |
| [0004](0004-glicko2-rating-system.md) | Glicko-2 als Rating-System (via austauschbares RatingSystem-Interface) | Accepted | planned |
| [0005](0005-stockfish-hybrid.md) | Stockfish Hybrid — Server-Prozess für KI-Gegner, Stockfish.js für Evaluation Bar | Accepted | planned |
| [0006](0006-build-orchestration.md) | Build-Orchestrierung — Gradle Composite Build + pnpm Workspaces + node-gradle Plugin | Accepted | complete |
| [0007](0007-jsexport-in-commonmain.md) | @JsExport in commonMain — keine jsMain-Fassade | Accepted | complete |
| [0008](0008-openapi-first-codegen.md) | OpenAPI-First + Code Generation — Backend Stubs und Frontend Axios Client | Accepted | complete |
| [0009](0009-embedded-postgres-fuer-tests.md) | Zonky Embedded PostgreSQL für Tests statt H2 oder Testcontainers | Accepted | complete |
| [0010](0010-package-by-feature-backend.md) | Package-by-Feature im Backend — kein Hexagonal, keine Backend-Submodule | Accepted | complete |
| [0011](0011-minimaler-dependency-kern.md) | Minimaler, erklärter Dependency-Kern — kein Lombok, kein MapStruct | Accepted | complete |
| [0012](0012-security-von-tag-eins.md) | Spring Security von Tag 1, initial explizit auf permit-all | Accepted | partial ¹ |
| [0013](0013-agenten-topologie.md) | Agenten-Topologie — zwei Subagenten, zwei Skills, drei Schwellen | Accepted | partial ² |

¹ Die `SecurityFilterChain`-Bean existiert, das vorgesehene JWT-Filter-Skelett nicht — dort steht ein `TODO`.

² Die vier Werkzeuge für *jetzt* stehen unter `.claude/`. Die drei Agenten mit benanntem Auslöser sind absichtlich nicht angelegt — `partial` heißt hier „planmäßig unvollständig", nicht „Rückstand".

**0010 bis 0012 sind nachträglich verschriftlicht.** Die Entscheidungen wurden beim Aufsetzen des Backends getroffen und lagen bis dahin in einem einzelnen Dokument (`chesstopia-backend/SpringDesign.MD`), das keine ADR-Form hatte und neben diesem Register eine zweite Entscheidungsablage bildete. Begründungen und verworfene Alternativen stammen von dort; das Dokument ist aufgelöst.

**`Status` und `Umsetzung` sind zwei verschiedene Fragen.** `Status` sagt, ob die Entscheidung gilt; `Umsetzung` (`planned` · `partial` · `complete`), ob sie gebaut ist. Vier ADRs beschreiben Absicht, nicht Bestand — ohne diese Spalte liest man sie als Beschreibung des Systems.

**Keine Datumsspalte.** Kein ADR trägt ein Entscheidungsdatum im Dokument. Es aus `git log` abzuschreiben würde die History duplizieren und ab dem ersten Rebase falsch sein — die Spalte kommt, sobald die ADRs ein belastbares Datumsfeld im Frontmatter haben.

**Diese Datei wird derzeit von Hand gepflegt.** Sie soll später aus dem Frontmatter der ADRs erzeugt werden; bis dahin gilt: Ein neues ADR trägt sich hier ein.

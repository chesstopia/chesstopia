---
type: note
status: current
updated: 2026-08-09
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
| [0009](0009-ci-pipeline-build-test.md) | CI-Pipeline — Build- & Test-Health-Check (Bitbucket) | Partially superseded ⁴ | complete |
| [0010](0010-deployment-cicd-infrastruktur.md) | Deployment- & CI/CD-Infrastruktur | Partially superseded ⁴ | complete |
| [0011](0011-migration-nach-github-actions.md) | Migration nach GitHub Actions & GHCR | Accepted | complete |
| [0012](0012-embedded-postgres-fuer-tests.md) | Zonky Embedded PostgreSQL für Tests statt H2 oder Testcontainers | Accepted | complete |
| [0013](0013-package-by-feature-backend.md) | Package-by-Feature im Backend — kein Hexagonal, keine Backend-Submodule | Accepted | complete |
| [0014](0014-minimaler-dependency-kern.md) | Minimaler, erklärter Dependency-Kern — kein Lombok, kein MapStruct | Accepted | complete |
| [0015](0015-security-von-tag-eins.md) | Spring Security von Tag 1, initial explizit auf permit-all | Accepted | partial ¹ |
| [0016](0016-agenten-topologie.md) | Agenten-Topologie — zwei Subagenten, zwei Skills, drei Schwellen | Accepted | partial ² |
| [0017](0017-produktionskonfiguration-im-repo.md) | Produktionskonfiguration im Repo — verboten ist der Wert, nicht die Datei | Accepted | complete |
| [0018](0018-status-partially-superseded.md) | Vierter Statuswert `partially-superseded` für ADRs | Accepted | complete |
| [0019](0019-teststrategie.md) | Teststrategie — vier Ebenen, zwei davon mit benanntem Auslöser | Accepted | partial ³ |
| [0020](0020-lernkonzept.md) | Lernmaterial als eigene Gattung — `docs/learn/`, Komplexitätsleiter, Lernnachweis | Draft ⁵ | partial ⁶ |

¹ Die `SecurityFilterChain`-Bean existiert, das vorgesehene JWT-Filter-Skelett nicht — dort steht ein `TODO`.

² Die Werkzeuge für *jetzt* stehen unter `.claude/`; `/tests` ist seit [ADR-0019](0019-teststrategie.md) dazugekommen. Die drei Agenten mit benanntem Auslöser sind absichtlich nicht angelegt — `partial` heißt hier „planmäßig unvollständig", nicht „Rückstand".

³ Ebene 1, 2 und 3 stehen. **Der benannte Auslöser für Ebene 4 — der Merge von PR #2 — ist am 9. August 2026 eingetreten.** `partial` heißt hier ab sofort „Rückstand", nicht mehr „planmäßig unvollständig"; Playwright ist ausstehend und bekommt ein eigenes Ticket, damit dieser PR bei der Wissensverwaltung bleibt.

⁴ Die Plattform ist weg, die Begründung nicht. Welcher Teil weiterhin gilt, steht im `## Status`-Abschnitt des jeweiligen ADR ([ADR-0018](0018-status-partially-superseded.md)); [ADR-0011](0011-migration-nach-github-actions.md) benennt die entfallenen Prämissen einzeln.

⁵ **Der einzige `draft` im Register, und zwar mit Absicht.** Eine Gattung festzuschreiben, von der noch kein Exemplar existiert, wäre Vorratsbau. Solange der Status `draft` ist, greift das Append-only-Verbot nicht und der Körper darf sich an dem korrigieren, was das Schreiben der ersten Lektionen zutage fördert. `accepted` wird er, wenn die Form sich getragen hat.

⁶ **Spur A ist vollständig** — Lektionen 01 bis 05 stehen, dazu die ausgeführten Sprossen unter `learn-examples/`; die Gattung ist in `checkDocs` verankert. Spur B, Vorlage, Skill `/lernen` und Portal entstehen später. Die Bildmechanik ebenfalls: Keine der fünf Lektionen verlangte ein Raster — der Bedarf lief jedes Mal auf Struktur mit Bezeichnern hinaus, und dafür ist Mermaid zuständig. **Der Auslöser für `learn-examples-jvm` ist damit fällig geworden und wurde geprüft:** Die Markdown-Leiter zur Backend-Lektion trägt bis zur Umkehrung der Kontrolle und bis zur Wanderung des Schemas; sie trägt *nicht* bei der Transaktionsgrenze, wo Verstehen daran hängt, den Abbruch einmal auszulösen. Der Auslöser gilt damit als eingetreten, das Subprojekt ist ausstehend und bekommt ein eigenes Ticket.

**0009 bis 0011 waren reserviert; die Lücke ist mit dem Merge von PR #2 am 9. August 2026 geschlossen.** Die drei ADRs lagen auf `CHESS-8-Initial-pipeline` und vergaben ihre Nummern zuerst — sie wurden nicht umnummeriert, weil sie sich gegenseitig unter genau diesen Nummern verlinken. Ihr Frontmatter ist beim Zusammenführen nachgetragen worden; die Körper sind unangetastet.

Genau hier ist die Nummernvergabe zweimal fehlgeschlagen: Ein Blick in `docs/adr/` zeigt nur den eigenen Branch. Die nächste freie Nummer wird deshalb über **alle** Branches ermittelt, nicht über das Arbeitsverzeichnis — das Skill `/adr` tut das. **Die nächste freie Nummer ist 0021.**

**0013 bis 0015 sind nachträglich verschriftlicht.** Die Entscheidungen wurden beim Aufsetzen des Backends getroffen und lagen bis dahin in einem einzelnen Dokument (`chesstopia-backend/SpringDesign.MD`), das keine ADR-Form hatte und neben diesem Register eine zweite Entscheidungsablage bildete. Begründungen und verworfene Alternativen stammen von dort; das Dokument ist aufgelöst.

**`Status` und `Umsetzung` sind zwei verschiedene Fragen.** `Status` sagt, ob die Entscheidung gilt; `Umsetzung` (`planned` · `partial` · `complete`), ob sie gebaut ist. Vier ADRs beschreiben Absicht, nicht Bestand — ohne diese Spalte liest man sie als Beschreibung des Systems.

**Keine Datumsspalte.** Kein ADR trägt ein Entscheidungsdatum im Dokument. Es aus `git log` abzuschreiben würde die History duplizieren und ab dem ersten Rebase falsch sein — die Spalte kommt, sobald die ADRs ein belastbares Datumsfeld im Frontmatter haben.

**Diese Datei wird derzeit von Hand gepflegt.** Sie soll später aus dem Frontmatter der ADRs erzeugt werden; bis dahin gilt: Ein neues ADR trägt sich hier ein.

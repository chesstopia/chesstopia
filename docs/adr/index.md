---
type: note
status: current
updated: 2026-09-02
---

# ADR-Register

Alle Architekturentscheidungen des Projekts. Ein ADR beantwortet **warum** etwas so ist — nicht, wie es heute aussieht.

| Nr. | Titel | Status | Umsetzung |
|---|---|---|---|
| [0001](0001-kotlin-multiplatform-chess-engine.md) | Kotlin Multiplatform für die geteilte Schach-Validierungslogik | Partially superseded ⁸ | partial ⁵ |
| [0002](0002-zwei-ki-abstraktionen.md) | Zwei getrennte KI-Abstraktionen — MoveEngine und ChessCoach | Accepted | planned |
| [0003](0003-move-event-log.md) | Move-Event-Log als Persistenzmodell für Partien | Partially superseded ⁸ | partial ⁶ |
| [0004](0004-glicko2-rating-system.md) | Glicko-2 als Rating-System (via austauschbares RatingSystem-Interface) | Accepted | planned |
| [0005](0005-stockfish-hybrid.md) | Stockfish Hybrid — Server-Prozess für KI-Gegner, Stockfish.js für Evaluation Bar | Accepted | planned |
| [0006](0006-build-orchestration.md) | Build-Orchestrierung — Gradle Composite Build + pnpm Workspaces + node-gradle Plugin | Accepted | complete |
| [0007](0007-jsexport-in-commonmain.md) | @JsExport in commonMain — keine jsMain-Fassade | Accepted | complete |
| [0008](0008-openapi-first-codegen.md) | OpenAPI-First + Code Generation — Backend Stubs und Frontend Axios Client | Accepted | complete |
| [0009](0009-ci-pipeline-build-test.md) | CI-Pipeline — Build- & Test-Health-Check (Bitbucket) | Partially superseded ⁴ | complete |
| [0010](0010-deployment-cicd-infrastruktur.md) | Deployment- & CI/CD-Infrastruktur | Partially superseded ⁴ | complete |
| [0011](0011-migration-nach-github-actions.md) | Migration nach GitHub Actions & GHCR | Accepted | complete |
| [0012](0012-embedded-postgres-fuer-tests.md) | Zonky Embedded PostgreSQL für Tests statt H2 oder Testcontainers | Accepted | complete |
| [0013](0013-package-by-feature-backend.md) | Package-by-Feature im Backend — kein Hexagonal, keine Backend-Submodule | Partially superseded ⁷ | complete |
| [0014](0014-minimaler-dependency-kern.md) | Minimaler, erklärter Dependency-Kern — kein Lombok, kein MapStruct | Partially superseded ⁹ | complete |
| [0015](0015-security-von-tag-eins.md) | Spring Security von Tag 1, initial explizit auf permit-all | Accepted | partial ¹ |
| [0016](0016-agenten-topologie.md) | Agenten-Topologie — zwei Subagenten, zwei Skills, drei Schwellen | Accepted | partial ² |
| [0017](0017-produktionskonfiguration-im-repo.md) | Produktionskonfiguration im Repo — verboten ist der Wert, nicht die Datei | Accepted | complete |
| [0018](0018-status-partially-superseded.md) | Vierter Statuswert `partially-superseded` für ADRs | Accepted | complete |
| [0019](0019-teststrategie.md) | Teststrategie — vier Ebenen, zwei davon mit benanntem Auslöser | Accepted | partial ³ |
| [0020](0020-hexagonale-architektur-und-notationsfreie-domaene.md) | Hexagonale Architektur im game-Feature + notationsfreie Domäne | Accepted | partial |
| [0021](0021-mapstruct-fuer-adapter-mappings.md) | MapStruct für die Adapter-Mappings | Accepted | complete |

¹ Die `SecurityFilterChain`-Bean existiert, das vorgesehene JWT-Filter-Skelett nicht — dort steht ein `TODO`.

² Die Werkzeuge für *jetzt* stehen unter `.claude/`; `/tests` ist seit [ADR-0019](0019-teststrategie.md) dazugekommen. Die drei Agenten mit benanntem Auslöser sind absichtlich nicht angelegt — `partial` heißt hier „planmäßig unvollständig", nicht „Rückstand".

³ Ebene 1, 2 und 3 stehen. **Der benannte Auslöser für Ebene 4 — der Merge von PR #2 — ist am 9. August 2026 eingetreten.** `partial` heißt hier ab sofort „Rückstand", nicht mehr „planmäßig unvollständig"; Playwright ist ausstehend und bekommt ein eigenes Ticket, damit dieser PR bei der Wissensverwaltung bleibt.

⁴ Die Plattform ist weg, die Begründung nicht. Welcher Teil weiterhin gilt, steht im `## Status`-Abschnitt des jeweiligen ADR ([ADR-0018](0018-status-partially-superseded.md)); [ADR-0011](0011-migration-nach-github-actions.md) benennt die entfallenen Prämissen einzeln.

⁵ **Von `complete` zurückgestuft, und das ist keine Korrektur eines Fehlers, sondern eine Präzisierung.** Vollständig war und ist die *Struktur*: ein Quellcode, zwei Ziele, beide Konsumenten am selben Artefakt. Nicht vollständig ist der *Gegenstand* — bis zum 10. August 2026 rief niemand die Engine auf, und seither ruft das Backend sie für die Mechanik eines Zuges. Die Regellogik selbst ist weiterhin ein `TODO`. Genau dafür trennt dieses Register `Status` von `Umsetzung`.

⁶ Gebaut ist der Kern des Ereignisstroms: `partie.position_snapshot` (JSONB der Stellung) als Snapshot, `zug` als lückenlose Folge mit `position_after` (JSONB) plus lesbaren `from_square`/`to_square`/`promotion`-Spalten ([ADR-0020](0020-hexagonale-architektur-und-notationsfreie-domaene.md)). Bewusst nicht gebaut ist alles, was heute keinen Schreiber hat — `san_notation` braucht Zugerzeugung (die Engine erzeugt heute keine Züge), die Analyse- und Eröffnungsfelder brauchen die MoveEngine aus [ADR-0002](0002-zwei-ki-abstraktionen.md), die Rating-Snapshots brauchen Nutzer und [ADR-0004](0004-glicko2-rating-system.md). `partial` heißt hier „planmäßig unvollständig".

⁷ Teilweise abgelöst durch [ADR-0020](0020-hexagonale-architektur-und-notationsfreie-domaene.md): nur die klassische Schichtung innerhalb eines Features ist für `game` aufgehoben; Package-by-Feature und der Ein-Modul-Schnitt gelten weiter.

⁸ Teilweise abgelöst durch [ADR-0020](0020-hexagonale-architektur-und-notationsfreie-domaene.md) — welcher Teil, steht im `## Status`-Abschnitt des jeweiligen ADR ([ADR-0018](0018-status-partially-superseded.md)).

⁹ Teilweise abgelöst durch [ADR-0021](0021-mapstruct-fuer-adapter-mappings.md): MapStruct ist aufgenommen; der übrige Dependency-Kern gilt unverändert.

**0009 bis 0011 waren reserviert; die Lücke ist mit dem Merge von PR #2 am 9. August 2026 geschlossen.** Die drei ADRs lagen auf `CHESS-8-Initial-pipeline` und vergaben ihre Nummern zuerst — sie wurden nicht umnummeriert, weil sie sich gegenseitig unter genau diesen Nummern verlinken. Ihr Frontmatter ist beim Zusammenführen nachgetragen worden; die Körper sind unangetastet.

Genau hier ist die Nummernvergabe zweimal fehlgeschlagen: Ein Blick in `docs/adr/` zeigt nur den eigenen Branch. Die nächste freie Nummer wird deshalb über **alle** Branches ermittelt, nicht über das Arbeitsverzeichnis — das Skill `/adr` tut das. **Die nächste freie Nummer ist 0022.**

**0013 bis 0015 sind nachträglich verschriftlicht.** Die Entscheidungen wurden beim Aufsetzen des Backends getroffen und lagen bis dahin in einem einzelnen Dokument (`chesstopia-backend/SpringDesign.MD`), das keine ADR-Form hatte und neben diesem Register eine zweite Entscheidungsablage bildete. Begründungen und verworfene Alternativen stammen von dort; das Dokument ist aufgelöst.

**`Status` und `Umsetzung` sind zwei verschiedene Fragen.** `Status` sagt, ob die Entscheidung gilt; `Umsetzung` (`planned` · `partial` · `complete`), ob sie gebaut ist. Ein Teil der ADRs beschreibt Absicht, nicht Bestand — ohne diese Spalte liest man sie als Beschreibung des Systems. Die Spalte darf sich dabei in **beide** Richtungen bewegen: [ADR-0001](0001-kotlin-multiplatform-chess-engine.md) ist am 10. August 2026 von `complete` auf `partial` gegangen, weil erst die erste echte Nutzung zeigte, worauf sich das `complete` bezogen hatte.

**Keine Datumsspalte.** Kein ADR trägt ein Entscheidungsdatum im Dokument. Es aus `git log` abzuschreiben würde die History duplizieren und ab dem ersten Rebase falsch sein — die Spalte kommt, sobald die ADRs ein belastbares Datumsfeld im Frontmatter haben.

**Diese Datei wird derzeit von Hand gepflegt.** Sie soll später aus dem Frontmatter der ADRs erzeugt werden; bis dahin gilt: Ein neues ADR trägt sich hier ein.

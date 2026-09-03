# CLAUDE.md

Betriebsanleitung für Agenten in diesem Repository. **Regeln, keine Erklärungen.**
Das *Warum* steht in den ADRs unter [docs/adr/](docs/adr/) und wird von hier verlinkt, nicht wiederholt.

---

## Grundsatz

**Die Dokumentation ist nicht die Wahrheit. Der Code ist die Realität.**

Widerspricht ein Dokument dem Code, ist das Dokument falsch — nicht der Code. Bei Unsicherheit gilt die Reihenfolge: Code und Build-Dateien → ADR → sonstige Doku.

---

## Das Projekt

Chesstopia ist ein Gradle-Monorepo mit vier Modulen und einem geteilten API-Kontrakt.

| Modul | Was | Sprache |
|---|---|---|
| `chess-engine` | Schachregeln, KMP — baut nach JVM-Jar **und** JS/ESM | Kotlin |
| `chesstopia-backend` | Spring Boot REST + WebSocket | Java |
| `chesstopia-frontend` | React/Vite | TypeScript |
| `openapi-client` | generierter Axios-Client — **nie von Hand editieren** | TypeScript (generiert) |

`docs/api/openapi.yaml` ist die Single Source of Truth der API. Aus ihr entstehen die Spring-Interfaces im Backend und der TypeScript-Client im Frontend ([ADR-0008](docs/adr/0008-openapi-first-codegen.md)).

Die Domänensprache — 25 Begriffe, verbindlich für Bezeichner und Gespräche — steht in [docs/context.md](docs/context.md).

Was bereits gebaut ist und wie es zusammenhängt, steht in [docs/index.md](docs/index.md). Diese beiden Dateien — `CLAUDE.md` und `docs/index.md` — reichen für den Kaltstart; alles Weitere ist von dort verlinkt.

---

## Build

```
./gradlew buildAll                    # kanonischer Einstiegspunkt: alles
./gradlew checkDocs                   # Doku-Konsistenz und Kontraktgrenzen — nach jeder Doku-Änderung
./gradlew :chesstopia-backend:build   # Backend allein (baut chess-engine mit)
./gradlew :chesstopia-backend:bootRun # Backend starten
pnpm --filter chesstopia-frontend dev # Frontend-Devserver
pnpm --filter chesstopia-frontend test
```

`chess-engine` wird als Composite Build eingebunden (`includeBuild`). Es gibt **kein** `publishToMavenLocal` und keinen manuellen Zwischenschritt — Gradle substituiert die Koordinate `io.chesstopia:chess-engine` zur Build-Zeit ([ADR-0006](docs/adr/0006-build-orchestration.md)).

**Gradle nie mit `sudo` ausführen.** Es hinterlässt root-eigene Dateien in `.gradle/` und `build/`, die den nächsten regulären Build brechen.

---

## Verbote

1. **Generierten Code nicht editieren und nicht committen.** Betroffen: `openapi-client/src/` und `chesstopia-backend/build/generated/openapi/`. Beide sind gitignored und werden bei jedem Build neu erzeugt — jede Änderung dort ist beim nächsten `buildAll` weg.
2. **Neue Endpunkte entstehen nie im Controller.** Sie beginnen in `docs/api/openapi.yaml`; der Controller implementiert danach das generierte Interface. Ein Controller trägt kein eigenes `@RequestMapping` ([ADR-0008](docs/adr/0008-openapi-first-codegen.md)).
3. **Schachregeln gehören nicht ins Backend.** Zuglogik, Legalitätsprüfung und Stellungsbewertung liegen ausschließlich in `chess-engine` ([ADR-0001](docs/adr/0001-kotlin-multiplatform-chess-engine.md)).
4. **Kein Kotlin im Backend.** Kotlin ist ausschließlich für `chess-engine` ([ADR-0001](docs/adr/0001-kotlin-multiplatform-chess-engine.md)).
5. **Kein Lombok.** Alle vier Adapter-Mapper sind `@Mapper(componentModel = "spring")`-Interfaces mit `unmappedTargetPolicy=ERROR` ([ADR-0021](docs/adr/0021-mapstruct-fuer-adapter-mappings.md)): `PositionJsonMapper`, `WebMapper`, `EngineMapper`, `GameEntityMapper`. Der Engine-JVM-Build trägt `-java-parameters`, damit MapStruct die Kotlin-`data class`-Konstruktoren per Parametername trifft. Hand-geschriebene `default`-Methoden in einem Mapper bekommen je einen eigenen Test, die generierten Abbildungen nicht. `SquareCodec` ist ein package-private Helfer. Die Domäne selbst bleibt Records ohne Framework.
6. **Keine Secrets im Repo — verboten ist der Wert, nicht die Datei.** Produktionskonfiguration ist versioniert (`application-prod.yml`, `docker-compose.prod.yml`, `infra/`); jeder Zugangsdatenwert darin kommt aus der Umgebung (`${VAR}`), aus Ansible (`{{ var }}`) oder aus Ansible Vault. Ein Literal an einer Secret-Stelle bricht den Build ([ADR-0017](docs/adr/0017-produktionskonfiguration-im-repo.md)).
7. **Versionsnummern nicht in Dokumente schreiben.** Toolchain- und Abhängigkeitsversionen stehen in `gradle/libs.versions.toml`, den `build.gradle.kts` und `openapi-client/openapitools.json`. Abgeschriebene Versionen driften unbemerkt — genau so ist die bestehende „Gradle 8.x"-Falschaussage entstanden.

---

## Konventionen

**Backend**
- Package-by-Feature (`io.chesstopia.backend.<feature>`). Das `game`-Feature ist hexagonal geschnitten (`domain` / `application` mit `port/in` + `port/out` / `adapter`) — siehe [ADR-0020](docs/adr/0020-hexagonale-architektur-und-notationsfreie-domaene.md). `counter` und `hello` bleiben klassisch geschichtet. Keine eigenen Gradle-Module pro Feature.
- REST unter `/api/v1/`, kebab-case in Pfaden, camelCase in JSON. Ausschließlich `application/json`, kein HATEOAS.
- Fehler als RFC-7807-`ProblemDetail` über den globalen `GlobalExceptionHandler`. 4xx ohne Logging, 5xx mit ERROR-Log.
- Spring Security ist von Anfang an im Classpath und explizit auf permissiv konfiguriert — das ist ein bewusster Zustand, kein vergessener. Nicht entfernen.

**Engine-Grenze**
- Die Engine-`@JsExport`-Grenze trägt strukturierte Objekte (`Position`, `Move`, `Piece`, `Square`), **keine FEN/UCI** ([ADR-0020](docs/adr/0020-hexagonale-architektur-und-notationsfreie-domaene.md)). FEN ist im Projekt derzeit nicht in Gebrauch; erst wenn der künftige Stockfish-Adapter (ADR-0005) es braucht, entsteht eine `toFen`-Hilfe in der Engine — nie in Domäne oder API.
- `@JsExport` steht in `commonMain` ([ADR-0007](docs/adr/0007-jsexport-in-commonmain.md)). Exportierte Sammlungen sind `Array<T>`, nicht `List<T>` (z. B. `Position.board`, `LegalMovesResult.moves`); wo eine exportierte `Array<T>` in Java-Code weiterverwendet wird (z. B. `LegalMovesResult.moves` mit CHESS-2), erfolgt die Konvertierung mit `.toList()` direkt am Engine-Aufruf.
- Die Übersetzung Domäne ↔ Engine liegt ausschließlich im `ChessEngineAdapter`.

**Tests**
- Jeder Testkörper ist in `// ARRANGE` · `// ACT` · `// ASSERTIONS` gegliedert, in dieser Reihenfolge. Eine leere Phase entfällt; sind Act und Assertion untrennbar (Exception-Prüfung), steht `// ACT & ASSERTIONS`. Gilt für JUnit, `kotlin.test` und Vitest.
- Kontext-Tests gegen die Datenbank brauchen `@AutoConfigureEmbeddedDatabase` ([ADR-0012](docs/adr/0012-embedded-postgres-fuer-tests.md)) — ohne die Annotation läuft der Test gegen die echte Datenbank.
- Frontend-Tests laufen unter Vitest. `defineConfig` kommt in der Vitest-Konfiguration aus `vitest/config`, nicht aus `vite`. Vitest läuft ohne `globals: true` — `describe`/`it`/`expect` werden importiert.
- Welche Testebene ein Feature braucht, entscheidet [ADR-0019](docs/adr/0019-teststrategie.md); ausgeführt wird das vom Skill `/tests`. E2E ist noch nicht gebaut — der Auslöser steht im ADR.

---

## Dokumentation

**Bevor etwas aufgeschrieben wird, die Türschwelle:** Ein Wissensstück wird nur persistiert, wenn es mindestens eines davon verhindert —

1. einen wiederkehrenden Fehler
2. eine falsche Architekturentscheidung
3. eine unnötige Recherche
4. eine falsche Änderung durch einen Agenten
5. das erneute Treffen einer bereits getroffenen Entscheidung

Trifft keines zu, wird es **nicht** aufgeschrieben. Jedes Dokument erzeugt dauerhaft Lese-, Prüf- und Driftkosten.

**Nicht persistiert wird**, was aus dem Code ablesbar ist (Namen, Signaturen, Paketstruktur), was `git log` beantwortet, was in den Build-Dateien steht (siehe Verbot 7) und jede Zustandsbeschreibung, die sich durch Hinzufügen einer Datei ändert.

**Die Weiche:** Wurde etwas **entschieden** → ADR unter `docs/adr/`. Wurde etwas **herausgefunden** → Notiz unter `docs/notes/`. Vorlagen für ADR, Notiz und Modulbeschreibung liegen in [docs/_templates/](docs/_templates/); ein neues ADR trägt sich in [docs/adr/index.md](docs/adr/index.md) ein.

**Jedes Dokument in `docs/` trägt Frontmatter** mit `type` und `status`. Erlaubt sind für `adr` die Werte `accepted` · `superseded` · `partially-superseded` · `draft`, für `note` `current` · `draft` · `deprecated`, für `module` `active` · `deprecated`. `partially-superseded` heißt: Ein Teil der Entscheidung gilt weiter, ein anderer nicht — welcher, steht im `## Status`-Abschnitt des ADR ([ADR-0018](docs/adr/0018-status-partially-superseded.md)). Ein ADR trägt zusätzlich `implementation` (`planned` · `partial` · `complete`) — das Feld trennt „noch nicht gebaut" von „nicht mehr gültig".

**Wer eine Zahl oder einen Bezeichner aus dem Code in ein Dokument schreibt, schreibt dazu, woher sie stammt** — als `verifies: ['pfad :: erwarteter wert']` im Frontmatter. `checkDocs` sucht den Wert in der Datei und schlägt fehl, wenn er verschwindet. Genau so wäre die „Gradle 8.x"-Falschaussage am Tag des Wrapper-Upgrades aufgefallen. Nur die Substring-Form ist implementiert; ein `#`-Selektor im Pfad ist ein Fehler, kein stiller Durchlauf.

**Links sind relative Markdown-Links, keine Wikilinks.** `[[0003-move-event-log]]` rendert auf GitHub als Literaltext.

**ADRs sind append-only.** Der Körper eines ADR — die Begründung, die zum Entscheidungszeitpunkt galt — wird nie editiert. Überholte ADRs bekommen `Superseded by`. Änderbar ist nur das Frontmatter, weil es Zustand ist.

**Verworfene Alternativen gehören ins ADR**, nicht in eine Notiz. Eine zweite Entscheidungsablage neben `docs/adr/` untergräbt die Konvention.

**Vor einer Änderung an einem Modul: `docs/modules/<modul>.md` lesen**, falls es existiert. Ändert die Arbeit Zweck, Grenzen oder Wellenwirkung des Moduls — nicht bloß seinen Inhalt —, wird das Dokument im selben Commit angepasst. Die Einschränkung trägt die Regel: Eine neue Datei im Modul ändert die Beschreibung nicht, eine neue Abhängigkeit nach außen schon.

**Obsidian ist eine Linse, kein Speicher.** `docs/` ist als Obsidian-Vault nutzbar, aber kein Plugin darf tragend werden: Jede Datei muss ohne Obsidian vollständig lesbar sein. Keine Dataview-Blöcke in versionierten Dokumenten.

---

## Werkzeuge

Fünf davon liegen unter `.claude/` und sind versioniert, weil sie Projektwissen tragen. Sie werden von Hand aufgerufen.

| Werkzeug | Wofür |
|---|---|
| `/adr` | Eine gefallene Architekturentscheidung festhalten — Nummernvergabe, Frontmatter, Registereintrag |
| `/api-endpoint` | Einen REST-Endpunkt hinzufügen — Kontrakt vor Controller, siehe Verbot 2 |
| `/tests` | Ein fertiges Feature absichern — Ebenenwahl nach [ADR-0019](docs/adr/0019-teststrategie.md), Randfallkatalog, Gegenprobe |
| `build-doctor` | Roter Build, rote Pipeline, roter Test, wenn die Ursache nicht in der ersten Fehlerzeile steht |
| `session-harvester` | Wissen aus Sessionverläufen ernten; schlägt Absätze für `docs/` vor und schreibt nie selbst |

**Welche Agenten es bewusst nicht gibt und warum, steht in [ADR-0016](docs/adr/0016-agenten-topologie.md)** — mitsamt den vier Bedingungen, die ein Kandidat erfüllen muss. Vor jedem Vorschlag für einen neuen Agenten wird diese Liste gelesen. Es gibt keinen Agenten für Code-Review, Testautorenschaft oder Repo-Suche; dafür existieren `/code-review` und `Explore`.

**Was ein Skript entscheiden kann, bekommt keinen Agenten.** Ist eine wiederkehrende Prüfung deterministisch, ist die richtige Antwort eine weitere Regel in `gradle/check-docs.gradle.kts` — nicht eine Agentendatei.

---

## Wo was steht

| Frage | Ort |
|---|---|
| Was ist das hier für ein System? | [docs/index.md](docs/index.md) |
| Welche Agenten und Skills gibt es? | Abschnitt *Werkzeuge*, Begründung in [ADR-0016](docs/adr/0016-agenten-topologie.md) |
| Warum ist es so entschieden? | [docs/adr/index.md](docs/adr/index.md) |
| Was darf ich in diesem Modul nicht tun? | [docs/modules/](docs/modules/) |
| Wie ist etwas konkret eingerichtet? | [docs/notes/](docs/notes/) |
| Was heißt dieser Domänenbegriff? | [docs/context.md](docs/context.md) |
| Wie sieht die API aus? | [docs/api/openapi.yaml](docs/api/openapi.yaml) |
| Woran wird gerade geplant? | `docs/local/` — gitignored, nie referenzieren |

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
5. **Kein Lombok, kein MapStruct.** Records und moderne Sprachfeatures ersetzen sie; Mapping wird zunächst von Hand geschrieben.
6. **Keine Secrets im Repo.** `application-prod.yml` existiert hier nicht und wird nicht angelegt. Produktionswerte kommen ausschließlich aus Umgebungsvariablen.
7. **Versionsnummern nicht in Dokumente schreiben.** Toolchain- und Abhängigkeitsversionen stehen in `gradle/libs.versions.toml`, den `build.gradle.kts` und `openapi-client/openapitools.json`. Abgeschriebene Versionen driften unbemerkt — genau so ist die bestehende „Gradle 8.x"-Falschaussage entstanden.

---

## Konventionen

**Backend**
- Package-by-Feature (`io.chesstopia.backend.<feature>`), innerhalb eines Features klassische Schichtung. Kein Hexagonal, keine eigenen Gradle-Module pro Feature.
- REST unter `/api/v1/`, kebab-case in Pfaden, camelCase in JSON. Ausschließlich `application/json`, kein HATEOAS.
- Fehler als RFC-7807-`ProblemDetail` über den globalen `GlobalExceptionHandler`. 4xx ohne Logging, 5xx mit ERROR-Log.
- Spring Security ist von Anfang an im Classpath und explizit auf permissiv konfiguriert — das ist ein bewusster Zustand, kein vergessener. Nicht entfernen.

**Engine-Grenze**
- `@JsExport` steht in `commonMain` ([ADR-0007](docs/adr/0007-jsexport-in-commonmain.md)). Exportierte Rückgabetypen sind deshalb `Array<Move>`, nicht `List<Move>`.
- Die Konvertierung erfolgt mit `.toList()` **direkt am Engine-Aufruf**. Das `Array`-Format dringt nicht bis in die REST-Schicht.

**Tests**
- Kontext-Tests gegen die Datenbank brauchen `@AutoConfigureEmbeddedDatabase` ([ADR-0009](docs/adr/0009-embedded-postgres-fuer-tests.md)) — ohne die Annotation läuft der Test gegen die echte Datenbank.
- Frontend-Tests laufen unter Vitest. `defineConfig` kommt in der Vitest-Konfiguration aus `vitest/config`, nicht aus `vite`.

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

**Die Weiche:** Wurde etwas **entschieden** → ADR unter `docs/adr/`. Wurde etwas **herausgefunden** → Notiz unter `docs/notes/`. Vorlagen für beides liegen in [docs/_templates/](docs/_templates/); ein neues ADR trägt sich in [docs/adr/index.md](docs/adr/index.md) ein.

**ADRs sind append-only.** Der Körper eines ADR — die Begründung, die zum Entscheidungszeitpunkt galt — wird nie editiert. Überholte ADRs bekommen `Superseded by`. Änderbar ist nur das Frontmatter, weil es Zustand ist.

**Verworfene Alternativen gehören ins ADR**, nicht in eine Notiz. Eine zweite Entscheidungsablage neben `docs/adr/` untergräbt die Konvention.

**Vor einer Änderung an einem Modul: `docs/modules/<modul>.md` lesen**, falls es existiert. Ändert die Arbeit Zweck, Grenzen oder Wellenwirkung des Moduls — nicht bloß seinen Inhalt —, wird das Dokument im selben Commit angepasst. Die Einschränkung trägt die Regel: Eine neue Datei im Modul ändert die Beschreibung nicht, eine neue Abhängigkeit nach außen schon.

**Obsidian ist eine Linse, kein Speicher.** `docs/` ist als Obsidian-Vault nutzbar, aber kein Plugin darf tragend werden: Jede Datei muss ohne Obsidian vollständig lesbar sein. Keine Dataview-Blöcke in versionierten Dokumenten.

---

## Wo was steht

| Frage | Ort |
|---|---|
| Was ist das hier für ein System? | [docs/index.md](docs/index.md) |
| Warum ist es so entschieden? | [docs/adr/index.md](docs/adr/index.md) |
| Was darf ich in diesem Modul nicht tun? | [docs/modules/](docs/modules/) |
| Was heißt dieser Domänenbegriff? | [docs/context.md](docs/context.md) |
| Wie sieht die API aus? | [docs/api/openapi.yaml](docs/api/openapi.yaml) |
| Woran wird gerade geplant? | `docs/local/` — gitignored, nie referenzieren |

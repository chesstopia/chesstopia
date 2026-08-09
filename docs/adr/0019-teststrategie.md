---
type: adr
status: accepted
implementation: partial
updated: 2026-08-09
supersedes: []
verifies:
  - 'chesstopia-frontend/package.json :: vitest'
  - 'chesstopia-backend/build.gradle.kts :: spring-boot-webtestclient'
  - 'chesstopia-backend/src/test/java/io/chesstopia/backend/ChessTopiaApplicationTests.java :: AutoConfigureEmbeddedDatabase'
  - 'chess-engine/src/commonTest/kotlin/io/chesstopia/engine/ChessEngineTest.kt :: kotlin.test'
---

# ADR-0019: Teststrategie — vier Ebenen, zwei davon mit benanntem Auslöser

## Status
Accepted

## Context

Tests sollen künftig nach jedem gebauten Feature entstehen, ausgeführt von einem Skill. Bevor ein Skill das ausführen kann, muss entschieden sein, *was* er ausführt — sonst steckt die Teststrategie in einer Werkzeugdatei und bildet eine zweite Entscheidungsablage neben `docs/adr/`, die es hier nicht gibt.

Eine solche Entscheidung existiert bislang nicht. [ADR-0012](0012-embedded-postgres-fuer-tests.md) wählt ein Werkzeug für Datenbanktests, keine Strategie.

Der Bestand zum Entscheidungszeitpunkt ist dünn und schief: 154 Zeilen Test in drei Dateien gegen 595 Zeilen Produktivcode in 23 Dateien. Entscheidender als die Menge ist, was sie behauptet. Drei der vier Engine-Tests prüfen, dass `getLegalMoves`, `validateMove` und `applyMove` einen `NotImplementedError` werfen — die Suite bestätigt, dass die Engine leer ist. Der Backend-Test lädt den Kontext. Im Frontend ist genau die reine Funktion in `fen.ts` geprüft; die vier Komponenten und der zustandstragende Hook `useBoardState` sind es nicht, denn Vitest läuft unter `environment: "node"`, es gibt kein DOM.

Das Muster ist erkennbar: Getestet wurde, was leicht zu testen war. Ohne benannte Ebenen entscheidet die Bequemlichkeit, wo geprüft wird.

Dazu kommt eine Messung, die [ADR-0016](0016-agenten-topologie.md) bereits vorgenommen hat und die hier zum zweiten Mal trägt: Die riskanten Änderungen dieses Projekts laufen **quer** durch die Module. Eine Änderung an `openapi.yaml` bewegt vier Artefakte in drei Sprachen ([ADR-0008](0008-openapi-first-codegen.md)), eine an der Engine zwei Konsumenten ([ADR-0001](0001-kotlin-multiplatform-chess-engine.md)).

## Considered Options

- **Keine Ebenen benennen, „gut testen" genügt** — der Ist-Zustand, und er hat genau das erzeugt, was oben steht: Tests dort, wo sie leicht fielen, keine dort, wo sie tragen. Eine Regel, die niemanden zu etwas Unbequemem verpflichtet, ist keine.
- **Vollständige Pyramide sofort, inklusive E2E** — abgelehnt an einer Voraussetzung, nicht am Werkzeug. E2E braucht Frontend, Backend und Postgres gemeinsam; die Compose-Dateien und der CI-Workflow liegen im offenen PR #2 und nicht auf `main`. Die CI-Anbindung würde entweder gegen eine dort nicht existierende Datei geschrieben oder nach dem Merge ein zweites Mal. Eine E2E-Suite, die nicht in CI läuft, wird beim ersten roten Lauf lokal übersprungen und ist danach Dekoration.
- **Cypress statt Playwright** — abgelehnt. Playwright deckt Chromium, Firefox und WebKit mit einem Werkzeug ab und braucht keinen eigenen Testrunner-Dialekt neben Vitest.
- **E2E dauerhaft weglassen** — abgelehnt an der Messung aus ADR-0016. Weder ein Unit- noch ein Integrationstest sieht die Naht zwischen den Modulen; eine Vertragsänderung, die Backend und Frontend auseinandertreibt, ist auf jeder anderen Ebene grün.
- **Komponenten dumm halten und nur reine Funktionen testen** — verlockend, weil es Ebene 2 spart. Abgelehnt, weil die Naht zwischen reiner Funktion und Darstellung hier gerade die interessante ist: `useBoardState` hält Zustand, das Brett rendert 64 Felder aus einer FEN. Ein Fehler an dieser Stelle ist in `fen.ts` nicht sichtbar.

## Decision

Vier Testebenen mit je einem Gegenstand, einem Werkzeug und einer Pflicht.

| Ebene | Gegenstand | Werkzeug | Pflicht bei |
|---|---|---|---|
| 1 Unit | reine Funktionen, Engine-Regeln | Vitest · `kotlin.test` · JUnit | jeder Funktion mit Verzweigung |
| 2 Komponente | React-Komponenten und Hooks gegen ein DOM | Vitest mit jsdom + Testing Library | jeder Komponente, die Zustand hält oder Domänendaten rendert |
| 3 Integration | Backend gegen echte Datenbank und echten HTTP-Port | `WebTestClient` + Zonky ([ADR-0012](0012-embedded-postgres-fuer-tests.md)) | jedem Endpunkt |
| 4 E2E · Smoke | der Durchstich durch alle Module | Playwright | jedem Feature, das Frontend und Backend zugleich berührt |

**Smoke ist keine eigene Ebene, sondern eine Teilmenge von Ebene 4**: der eine Durchstich, der nach jedem Deploy läuft — Anwendung lädt, Brett rendert, Backend antwortet, Datenbank hält den Zustand. Unter einer Minute. Damit hat der Begriff im Projekt eine Bedeutung statt eines Gefühls.

Ebene 2 wird **sofort** nachgerüstet. Ebene 4 hat einen benannten Auslöser: **den Merge von PR #2**, der Compose-Dateien und CI-Workflow nach `main` bringt. Bis dahin wird Playwright nicht angelegt.

**Die Ebenen sagen, wo geprüft wird — nicht, was.** Das Urteil, welcher Randfall zählt, bleibt beim Autor. Es bekommt aber ein Gedächtnis: Der Katalog der schachspezifischen Randfälle — en passant, Rochade durch Schach hindurch, Unterverwandlung, Patt gegen Matt, 50-Züge-Regel, dreifache Stellungswiederholung, gefesselte Figur, FEN-Halbzugzähler — gehört in das ausführende Skill, nicht hierher. Eine Checkliste ist keine Entscheidung; sie muss beim Schreiben zur Hand sein, nicht beim Entscheiden.

## Consequences

- jsdom und Testing Library kommen ins Frontend; `environment: "node"` in `vite.config.ts` gilt nicht mehr pauschal.
- Ebene 4 fehlt absichtlich. `implementation: partial` sagt das, und bis der Auslöser eintritt, ist die Lücke kein Rückstand.
- Die Ausführung ist ein **Skill, kein Agent**. [ADR-0016](0016-agenten-topologie.md) ordnet kontextabhängige Aufgaben Skills zu; ein Test-Autor als Subagent bleibt ausgeschlossen, weil er kalt startet und damit genau das Wissen verliert, aus dem die Randfälle stammen.
- Was ein Skript entscheiden kann, bekommt kein Skill: Ob zu einer Produktivdatei überhaupt eine Testdatei existiert, ist deterministisch prüfbar und gehört als Regel in `gradle/check-docs.gradle.kts`. Ob der Test etwas prüft, ist es nicht.
- Vier Ebenen kosten Laufzeit. Ebene 3 und 4 laufen nicht bei jedem Speichern, sondern in CI und vor dem Merge.
- Ebene 2 und 4 erzeugen Testcode, der bei jeder Umgestaltung der Oberfläche mitwandert. Es gilt das Abbruchkriterium dieses Projekts: **Eine Ebene, die über drei Läufe hinweg keinen echten Befund geliefert hat, wird gestrichen — nicht optimiert.**
- Die Engine-Tests bleiben vorerst Platzhalter, die `NotImplementedError` behaupten. Sobald `getLegalMoves` Züge erzeugt, greift die in ADR-0016 benannte Schwelle für `engine-referee`, und Ebene 1 bekommt in der Engine ihr objektives Orakel. Dieses ADR nimmt das nicht vorweg.

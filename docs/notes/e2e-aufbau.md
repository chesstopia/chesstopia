---
type: note
status: current
updated: 2026-09-07
verifies:
  - 'e2e/playwright.config.ts :: webServer'
  - 'chesstopia-frontend/vite.config.ts :: preview'
  - 'chesstopia-backend/src/main/resources/application.yml :: chesstopia_dev'
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/config/SecurityConfig.java :: http://localhost:4173'
  - 'build.gradle.kts :: pnpmE2eTest'
  - 'e2e/playwright.config.ts :: mechanik'
  - 'build.gradle.kts :: --project=mechanik'
  - 'e2e/corpus/runner.ts :: runCase'
---

# E2E-Aufbau

Wie der Stack für Ebene 4 ([ADR-0019](../adr/0019-teststrategie.md)) hochkommt. Das *Warum* der Werkzeugwahl steht im ADR; hier steht nur, was beim Aufbau tatsächlich im Weg stand.

## Drei Teile, ein Postgres

Playwright startet Backend und Frontend über zwei `webServer`-Einträge in `e2e/playwright.config.ts` — das Backend als `java -jar` auf dem gebauten Boot-Jar, das Frontend als Vite-Preview gegen das gebaute Bundle, nicht als Devserver. Postgres startet keiner der beiden: lokal per `docker compose up -d postgres`, in CI per Service-Container mit denselben Zugangsdaten wie `docker-compose.yml`. Beides trifft `application.yml` unverändert — es gibt kein eigenes E2E-Profil.

Einstiegspunkt ist `./gradlew pnpmE2eTest`, nicht `buildAll`.

## Der Preview-Server braucht seinen eigenen Proxy

`vite.config.ts` hatte einen `server.proxy`-Eintrag für `/api`, aber keinen `preview.proxy`. Ohne den zweiten laufen alle API-Aufrufe des E2E-Stacks ins Leere, und zwar als Verbindungs- statt als Testfehler.

## Der Preview-Port muss in der CORS-Allowlist stehen

`SecurityConfig` führt die erlaubten Origins als feste Liste. Sie kannte nur den Devserver-Port; gegen den Preview-Port antwortete das Backend mit `Invalid CORS request`. Die Tücke: mit `curl` ist das unsichtbar, weil ohne `Origin`-Header gar nicht geprüft wird — der Fehler zeigt sich ausschließlich im Browser. Wer einen weiteren Port hinzunimmt, trägt ihn dort ein.

## Argumente an Vite gehen durch pnpm verloren

`pnpm --filter chesstopia-frontend run preview -- --port 4173` reicht das `--` wörtlich weiter; Vites CLI wertet alles danach als Positionsargument und ignoriert `--port` und `--strictPort` stillschweigend — der Server startet dann auf dem nächsten freien Port statt zu scheitern. Ohne `--` kommen die Flags an.

Umgekehrt bei der Skript-Kurzform: `pnpm --filter e2e test --project=chromium` bricht mit `Unknown option: 'project'` ab, weil pnpm die Option für sich beansprucht. Deshalb rufen die Gradle-Tasks Playwright über `pnpm … exec playwright test …` auf.

## pnpm ist für Kindprozesse auf dem PATH, für den Workflow nicht

Node und pnpm liegen unter `.gradle/`, nicht auf dem PATH des Runners — ein blankes `pnpm` in einem Workflow-Schritt findet nichts. Eine `PnpmTask` legt beide aber auf den PATH ihrer Kindprozesse; deshalb darf der `webServer`-Eintrag in der Playwright-Config `pnpm` aufrufen, während der Workflow es nicht darf.

## Wie ein Test an die `gameId` kommt

`useBoardState` legt bei jedem Mount eine neue Partie an; die `gameId` steht weder in der URL noch im Storage. Ein Reload zeigt deshalb immer die Startstellung — Persistenz ist über die Oberfläche unsichtbar. Der Smoke-Test liest die `gameId` stattdessen aus der abgefangenen Netzwerkantwort auf `POST /api/v1/games` und prüft die Persistenz danach direkt über den Kontrakt.

## Warum die Pointer-Geste kein `dragTo()` ist

`Chessboard.tsx` reagiert auf Pointer-Events, nicht auf die HTML5-Drag-API. Playwrights `locator.dragTo()` setzt genau die voraus und bewegt in dieser Komponente keine Figur. `e2e/tests/support/drag.ts` fährt stattdessen `page.mouse` mit Zwischenschritten, damit das Zielfeld sein `pointerenter` bekommt, bevor der Zeiger dort losgelassen wird.

## Die Sperre nach Partieende ist doppelt

Ein Zugversuch auf beendeter Partie wird an zwei Stellen gestoppt: `App.tsx` reicht `disabled` ans Brett, und `useBoardState.playMove` kehrt bei nicht laufender Partie früh zurück. Wer den E2E-Test für die Sperre als Gegenprobe entkräften will, muss beide entfernen — eine allein lässt ihn grün.

## Deploy-Smoke ohne eigenen Stack

Mit gesetzter Umgebungsvariable `PLAYWRIGHT_BASE_URL` überspringt die Config die `webServer`-Einträge komplett; `deploy.yml` nutzt das, um nach jedem Rollout nur `smoke.spec.ts` gegen die echte Umgebung laufen zu lassen. Der Lauf ist nicht folgenlos: er legt dort eine Partie an und spielt einen Zug. Nach jedem Deploy steht also eine Zeile mehr in `partie` und `zug` — bewusst in Kauf genommen, weil ein Smoke, der die Datenbank nicht anfasst, die Datenbank auch nicht prüft.

## Der Korpus

Schachsituationen stehen als Dateien unter `e2e/testcases/<kategorie>/<name>.case` — eine Situation je Datei, eine Zeile je Datei im Report. Das *Warum* steht in [ADR-0024](../adr/0024-datei-getriebener-e2e-korpus.md); hier steht, wie man damit arbeitet.

Eine neue Datei hinlegen genügt. `e2e/tests/corpus.spec.ts` liest das Verzeichnis beim Laden rekursiv und erzeugt je `.case` ein `test()`. Es gibt keinen Codegen und keinen Sync-Schritt — anders als beim Engine-Korpus ([ADR-0022](../adr/0022-datei-getriebener-engine-testkorpus.md)), wo `commonTest` keinen Laufzeit-Dateizugriff hat.

Die Prüfmechanik — Brettleser, Parser, Driftwächter unter `e2e/corpus/` — läuft als eigenes Playwright-Projekt `mechanik`; `pnpmE2eTest` startet beide Projekte. Ohne den zweiten Eintrag liefe sie in CI nicht mit, und eine Mechanik, die nie rot war, prüft nichts.

Preis dieser Lösung: Die Mechaniktests fahren die `webServer`-Einträge mit hoch, obwohl sie weder Browser noch Backend brauchen. Bewusst in Kauf genommen; die Alternative wäre eine zweite Werkzeugkette neben Playwright.

Zwei Kostenzahlen, damit die nächste Entscheidung über einen teuren Fall nicht wieder gemessen werden muss — seriell, ein Worker, lokal: Grundkosten rund 300 ms je Fall, Grenzkosten rund 165 ms je Halbzug. Der teuerste Fall (Patt, 19 Halbzüge) liegt bei rund 3,4 s. Die Rüstzeit des CI-Jobs übersteigt die Prüfzeit um ein Vielfaches — wer Laufzeit sparen will, sucht dort, nicht bei den Fällen.

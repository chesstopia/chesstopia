---
type: note
status: current
updated: 2026-10-25
verifies:
  - 'docker-compose.e2e.yml :: SITE_HOSTNAME'
  - 'docker-compose.e2e.yml :: infra/roles/edge/templates/Caddyfile'
  - 'e2e/playwright.config.ts :: PLAYWRIGHT_SHARED_ENV'
  - 'e2e/playwright.config.ts :: loadEnvFile'
  - 'e2e/.env :: PLAYWRIGHT_BASE_URL=http://localhost:5173'
  - '.github/workflows/ci.yml :: PLAYWRIGHT_BASE_URL: http://localhost:8000'
  - 'e2e/package.json :: --project=mechanik'
  - 'e2e/korpus/runner.ts :: runCase'
  - 'e2e/app/intern/geste.ts :: ziehePerZeiger'
  - 'e2e/app/spieler.ts :: async versucheZug'
  - 'e2e/app/intern/aufraeumen.ts :: schneideAngelegtePartienMit'
  - 'infra/roles/edge/templates/Caddyfile :: reverse_proxy backend:8080'
  - 'chesstopia-backend/src/main/resources/application-prod.yml :: jdbc:postgresql://postgres:5432'
---

# E2E-Aufbau

Wie der Stack für Ebene 4 ([ADR-0019](../adr/0019-teststrategie.md)) hochkommt. Das *Warum* der Werkzeugwahl steht im ADR, der Schnitt der Pipeline in [ADR-0028](../adr/0028-artefakt-kette-und-e2e-gegen-den-prod-stack.md); hier steht nur, was beim Aufbau tatsächlich im Weg stand.

## Der Stack ist der Prod-Stack

Playwright startet nichts. Der Stack kommt aus zwei Compose-Dateien: `docker-compose.prod.yml` liefert Backend und Frontend unverändert so, wie sie deployed werden, `docker-compose.e2e.yml` ergänzt, was die Prod-Datei anderen Compose-Projekten überlässt — Postgres, Caddy und einen veröffentlichten Port.

```
docker network create chesstopia          # einmalig; in Prod legt Ansible es an
export IMAGE_REGISTRY=ghcr.io/chesstopia IMAGE_TAG=<short-sha>
export POSTGRES_DB=chesstopia_dev POSTGRES_USER=chesstopia POSTGRES_PASSWORD=egal
export JWT_SECRET=egal CHESSCOACH_API_KEY=egal
docker compose -f docker-compose.prod.yml -f docker-compose.e2e.yml up -d
cd e2e && pnpm install && pnpm exec playwright install chromium && PLAYWRIGHT_BASE_URL=http://localhost:8000 pnpm run test
```

Die `export`-Zeilen haben zwei verschiedene Gründe. `POSTGRES_*` braucht der Stack wirklich: `application-prod.yml` baut daraus Datenquelle und Zugangsdaten, und der Postgres-Container startet ohne Passwort nicht. `JWT_SECRET` und `CHESSCOACH_API_KEY` liest heute kein Code; sie stehen nur da, weil `docker-compose.prod.yml` sie interpoliert. Fehlen sie, warnt Compose und setzt einen Leerstring — kein Abbruch. Wer beim Startabbruch sucht, sucht deshalb bei `POSTGRES_*` und `IMAGE_*`. Die Werte sind im Wegwerf-Stack beliebig; in CI erzeugt der Workflow sie zur Laufzeit.

Mit einem lokal gebauten Stack statt gezogener Images: erst `./gradlew :chesstopia-backend:bootJar pnpmFrontendBuild`, dann `docker compose … build`. Beide Dockerfiles sind reine Artefakt-Kopien — ohne die Artefakte schlägt schon das `COPY` fehl.

## Gegen die Devserver

Laufen `bootRun` und der Vite-Devserver, genügt `pnpm run test`: Die versionierte `e2e/.env` setzt `PLAYWRIGHT_BASE_URL` auf den Devserver. Eine gesetzte Umgebungsvariable hat Vorrang vor der Datei — darüber wählen `ci.yml` den Compose-Stack und `deploy.yml` die Produktion. Fehlt die Variable dort, läuft die CI gegen einen Devserver, den es nicht gibt, und jeder Browser-Test endet in `ERR_CONNECTION_REFUSED`. Vite leitet `/api` und `/ws` ans Backend weiter. Geprüft ist damit der Dev-Pfad, nicht der Prod-Stack.

Der Devserver erzeugt den API-Client nicht neu. Nach einem Branchwechsel oder Rebase mit geänderter `openapi.yaml` liegt in `openapi-client/src/` der alte Client, und der Fehler sieht nach Fachlogik aus — so fehlte nach dem Rebase auf CHESS-19 der Header `X-Player-Token`, und jeder Zug bekam 403. Vorher `./gradlew generateOpenApiClient`.

## Die produktive Caddyfile wird gemountet, nicht abgeschrieben

`docker-compose.e2e.yml` hängt `infra/roles/edge/templates/Caddyfile` unverändert in den Caddy-Container. Eine Zweitfassung für CI ist ausdrücklich ausgeschlossen: Sie wäre genau die Stelle, an der eine veraltete Route stehen bliebe, während Produktion längst etwas anderes sagt.

Gesteuert wird nur `SITE_HOSTNAME` — Caddys eigene Env-Syntax `{$SITE_HOSTNAME}`, kein Template-Platzhalter. Im Wegwerf-Stack steht dort `:80`: Port 80, keine Host-Prüfung, kein ACME, kein TLS. Geprüft wird der Körper der Datei, also die Routen, nicht die Zertifikatslogik.

**Das ist der Grund für den ganzen Aufbau.** Die Caddyfile entfernt für `/api/*` den `Origin`-Header. In Produktion sieht das Backend deshalb nie einen CORS-Request; der frühere E2E-Stack über `vite preview` erzeugte einen und brauchte dafür einen eigenen Eintrag in der Origin-Allowlist. Geprüft wurde ein Pfad, den es in Produktion nicht gibt.

## Geteilte Umgebung oder Wegwerf-Stack

`PLAYWRIGHT_BASE_URL` sagt nur, *wohin*. Ob parallelisiert und wiederholt werden darf, entscheidet `PLAYWRIGHT_SHARED_ENV=1`: Gegen Produktion (Deploy-Smoke) verbietet geteilter Zustand beides, gegen den Wegwerf-Stack in CI nicht. Die Wiederholung hängt nicht an `CI` allein, weil GitHub Actions `CI=true` auch im Deploy-Smoke setzt. Die beiden Fragen waren früher dieselbe Variable — mit dem Compose-Stack ist die Basis-URL *immer* gesetzt, und E2E wäre in CI still seriell geworden.

Die Flags für die Playwright-Projekte stehen in den Skripten von `e2e/package.json`, nicht im Aufruf: `pnpm run test --project=…` beansprucht pnpm die Option für sich und bricht mit `Unknown option: 'project'` ab.

## Deploy-Smoke ohne eigenen Stack

`deploy.yml` fährt nach jedem Rollout `pnpm run smoke` gegen die echte Umgebung — `PLAYWRIGHT_BASE_URL` auf die Prod-URL, `PLAYWRIGHT_SHARED_ENV=1`. Der Smoke legt dort eine Partie an, spielt einen Zug, lädt neu und löscht die Partie im Teardown wieder über die API ([ADR-0031](../adr/0031-partien-sind-durch-den-ersteller-loeschbar.md)); geprüft wird die Datenbank weiterhin, weil Anlegen, Ziehen und Löschen sie durchlaufen. Welche Partien zu löschen sind, weiß der Teardown aus dem Mitschnitt aller erfolgreichen `POST /api/v1/games` der Seite (`app/intern/aufraeumen.ts`) — auch eine Partie, deren Anlegen im Test danach scheitert, und auch bei rotem Test.

## Zwei Seiten, zwei Browser-Kontexte

Eine Partie entsteht über „Neue Partie starten“ auf der Startseite; danach steht die `gameId` in der URL, und ein Reload lädt die Partie aus der Datenbank. Wer sie anlegt, spielt Weiß; Schwarz kommt über den Einladungslink. Beides sind Handlungen eines `Spieler` (`starteNeuePartie`, `trittBei`, in `e2e/app/spieler.ts`).

Jeder Spieler hat einen **eigenen Browser-Kontext**; ihn legt die Fixture `neuerSpieler` an. Die Rolle steht in `localStorage` (`chesstopia.games`), und `useGameState` bevorzugt einen vorhandenen Eintrag vor dem Token aus der URL — im Kontext des Erstellers spielte die Seite des Eingeladenen ebenfalls Weiß.

Die Gegenseite erfährt von einem Zug nur über den STOMP-Push auf `/ws`. Ein Zug, bevor deren Abo steht, geht verloren, und der Test hängt. `starteNeuePartie` und `trittBei` warten deshalb auf den gesendeten `SUBSCRIBE`-Frame (`app/intern/live.ts`); `ziehe` wartet vor der Geste auf „Du bist am Zug“ beim ziehenden Spieler.

## Einen Test schreiben

Das *Warum* der Schichten steht in [ADR-0030](../adr/0030-schichtung-der-e2e-tests.md). Specs importieren nur `e2e/testlauf.ts`, `e2e/app/` und `e2e/modell/` — nie `@playwright/test`; `tests/korpus.spec.ts` liest zusätzlich über `e2e/korpus/` und `node:*` die Fall-Dateien ein. Der Grenzwächter `e2e/korpus/__tests__/grenze.test.ts` läuft im Projekt `mechanik` und schlägt mit Datei und Zeile fehl, wenn eine Spec es doch tut.

Ein Test hat die Form `szenario('…', async ({ neuerSpieler }) => …)`; ohne Browser genügt `pruefung`. Gewartet wird nicht im Test.

- `ziehe(zug)` wartet auf das eigene Zugrecht, führt die Geste aus und wartet auf die Annahme; wird der Zug abgelehnt, scheitert es sofort mit `<farbe>: Zug <von>-<nach> abgelehnt: <text>`. Gleicht der Text der Ablehnung einem bereits sichtbaren Fehler, fällt sie erst beim Timeout auf.
- `versucheZug(zug)` führt nur die Geste aus und wartet auf nichts. Das ist die Wahl für Züge außer der Reihe, gegen Sperren und gegen einen künstlichen Serverfehler.
- `erwarte…` wiederholt bis zum Timeout; `stellung()` und `zuganzeige()` sind Momentaufnahmen.

## Warum die Pointer-Geste kein `dragTo()` ist

`Chessboard.tsx` reagiert auf Pointer-Events, nicht auf die HTML5-Drag-API. Playwrights `locator.dragTo()` setzt genau die voraus und bewegt in dieser Komponente keine Figur. `e2e/app/intern/geste.ts` fährt stattdessen `page.mouse` mit Zwischenschritten, damit das Zielfeld sein `pointerenter` bekommt, bevor der Zeiger dort losgelassen wird.

## Die Sperre nach Partieende ist doppelt

Ein Zugversuch auf beendeter Partie wird an zwei Stellen gestoppt: `GamePage.tsx` reicht `disabled` ans Brett, und `useGameState.playMove` kehrt bei nicht laufender Partie früh zurück. Wer den E2E-Test für die Sperre als Gegenprobe entkräften will, muss beide entfernen — eine allein lässt ihn grün.

Die Sperrgeste macht der Läufer bei der Seite, die ohne Partieende am Zug wäre. Bei der anderen Seite wäre sie wertlos: `disabled` greift dort schon wegen des fehlenden Zugrechts.

## Der Korpus

Schachsituationen stehen als Dateien unter `e2e/testcases/<kategorie>/<name>.case` — eine Situation je Datei, eine Zeile je Datei im Report. Das *Warum* steht in [ADR-0029](../adr/0029-datei-getriebener-e2e-korpus.md); hier steht, wie man damit arbeitet.

Eine neue Datei hinlegen genügt. `e2e/tests/korpus.spec.ts` liest das Verzeichnis beim Laden rekursiv und erzeugt je `.case` ein `test()`. Es gibt keinen Codegen und keinen Sync-Schritt — anders als beim Engine-Korpus ([ADR-0022](../adr/0022-datei-getriebener-engine-testkorpus.md)), wo `commonTest` keinen Laufzeit-Dateizugriff hat.

Die Prüfmechanik — Brettleser, Parser, Driftwächter unter `e2e/korpus/` — läuft als eigenes Playwright-Projekt `mechanik`; das Skript `test` startet beide Projekte. Ohne den zweiten Eintrag liefe sie in CI nicht mit, und eine Mechanik, die nie rot war, prüft nichts. Browser und Stack braucht sie nicht; sie kostet im E2E-Job trotzdem nichts, weil der Stack dort ohnehin schon steht, bevor Playwright startet.

Zwei Kostenzahlen, damit die nächste Entscheidung über einen teuren Fall nicht wieder gemessen werden muss — seriell, ein Worker, lokal: Grundkosten rund 300 ms je Fall, Grenzkosten rund 165 ms je Halbzug. Der teuerste Fall (Patt, 19 Halbzüge) liegt bei rund 3,4 s. Die Rüstzeit des Stacks übersteigt die Prüfzeit um ein Vielfaches — wer Laufzeit sparen will, sucht dort, nicht bei den Fällen.

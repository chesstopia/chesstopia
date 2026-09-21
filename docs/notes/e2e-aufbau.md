---
type: note
status: current
updated: 2026-09-21
verifies:
  - 'docker-compose.e2e.yml :: SITE_HOSTNAME'
  - 'docker-compose.e2e.yml :: infra/roles/edge/templates/Caddyfile'
  - 'e2e/playwright.config.ts :: PLAYWRIGHT_SHARED_ENV'
  - 'e2e/package.json :: --project=mechanik'
  - 'e2e/corpus/runner.ts :: runCase'
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
cd e2e && pnpm install && pnpm exec playwright install chromium && pnpm run test
```

Ohne die vier `export`-Zeilen bricht der Backend-Container beim Start ab: `application-prod.yml` löst `${POSTGRES_PASSWORD}` und `${JWT_SECRET}` auf, und Spring scheitert an einem unbelegten Platzhalter. Die Werte sind im Wegwerf-Stack beliebig; in CI erzeugt der Workflow sie zur Laufzeit.

Mit einem lokal gebauten Stack statt gezogener Images: erst `./gradlew :chesstopia-backend:bootJar pnpmFrontendBuild`, dann `docker compose … build`. Beide Dockerfiles sind reine Artefakt-Kopien — ohne die Artefakte schlägt schon das `COPY` fehl.

## Die produktive Caddyfile wird gemountet, nicht abgeschrieben

`docker-compose.e2e.yml` hängt `infra/roles/edge/templates/Caddyfile` unverändert in den Caddy-Container. Eine Zweitfassung für CI ist ausdrücklich ausgeschlossen: Sie wäre genau die Stelle, an der eine veraltete Route stehen bliebe, während Produktion längst etwas anderes sagt.

Gesteuert wird nur `SITE_HOSTNAME` — Caddys eigene Env-Syntax `{$SITE_HOSTNAME}`, kein Template-Platzhalter. Im Wegwerf-Stack steht dort `:80`: Port 80, keine Host-Prüfung, kein ACME, kein TLS. Geprüft wird der Körper der Datei, also die Routen, nicht die Zertifikatslogik.

**Das ist der Grund für den ganzen Aufbau.** Die Caddyfile entfernt für `/api/*` den `Origin`-Header. In Produktion sieht das Backend deshalb nie einen CORS-Request; der frühere E2E-Stack über `vite preview` erzeugte einen und brauchte dafür einen eigenen Eintrag in der Origin-Allowlist. Geprüft wurde ein Pfad, den es in Produktion nicht gibt.

**Benannte Lücke:** Die Caddyfile hat keine Route für `/ws`. `WebSocketConfig` registriert den STOMP-Endpunkt dort; ein Verbindungsversuch landet im Catch-All und damit im nginx. Eigenes Ticket — der Test dafür braucht zusätzlich einen Frontend-Client, den es noch nicht gibt.

## Geteilte Umgebung oder Wegwerf-Stack

`PLAYWRIGHT_BASE_URL` sagt nur, *wohin*. Ob parallelisiert werden darf, entscheidet `PLAYWRIGHT_SHARED_ENV=1`: Gegen Produktion (Deploy-Smoke) verbietet geteilter Zustand die Parallelität, gegen den Wegwerf-Stack in CI nicht. Die beiden Fragen waren früher dieselbe Variable — mit dem Compose-Stack ist die Basis-URL *immer* gesetzt, und E2E wäre in CI still seriell geworden.

Die Flags für die Playwright-Projekte stehen in den Skripten von `e2e/package.json`, nicht im Aufruf: `pnpm run test --project=…` beansprucht pnpm die Option für sich und bricht mit `Unknown option: 'project'` ab.

## Deploy-Smoke ohne eigenen Stack

`deploy.yml` fährt nach jedem Rollout `pnpm run smoke` gegen die echte Umgebung — `PLAYWRIGHT_BASE_URL` auf die Prod-URL, `PLAYWRIGHT_SHARED_ENV=1`. Der Lauf ist nicht folgenlos: Er legt dort eine Partie an und spielt einen Zug. Nach jedem Deploy steht also eine Zeile mehr in `partie` und `zug` — bewusst in Kauf genommen, weil ein Smoke, der die Datenbank nicht anfasst, die Datenbank auch nicht prüft.

## Wie ein Test an die `gameId` kommt

`useBoardState` legt bei jedem Mount eine neue Partie an; die `gameId` steht weder in der URL noch im Storage. Ein Reload zeigt deshalb immer die Startstellung — Persistenz ist über die Oberfläche unsichtbar. Der Smoke-Test liest die `gameId` stattdessen aus der abgefangenen Netzwerkantwort auf `POST /api/v1/games` und prüft die Persistenz danach direkt über den Kontrakt.

## Warum die Pointer-Geste kein `dragTo()` ist

`Chessboard.tsx` reagiert auf Pointer-Events, nicht auf die HTML5-Drag-API. Playwrights `locator.dragTo()` setzt genau die voraus und bewegt in dieser Komponente keine Figur. `e2e/tests/support/drag.ts` fährt stattdessen `page.mouse` mit Zwischenschritten, damit das Zielfeld sein `pointerenter` bekommt, bevor der Zeiger dort losgelassen wird.

## Die Sperre nach Partieende ist doppelt

Ein Zugversuch auf beendeter Partie wird an zwei Stellen gestoppt: `App.tsx` reicht `disabled` ans Brett, und `useBoardState.playMove` kehrt bei nicht laufender Partie früh zurück. Wer den E2E-Test für die Sperre als Gegenprobe entkräften will, muss beide entfernen — eine allein lässt ihn grün.

## Der Korpus

Schachsituationen stehen als Dateien unter `e2e/testcases/<kategorie>/<name>.case` — eine Situation je Datei, eine Zeile je Datei im Report. Das *Warum* steht in [ADR-0024](../adr/0024-datei-getriebener-e2e-korpus.md); hier steht, wie man damit arbeitet.

Eine neue Datei hinlegen genügt. `e2e/tests/corpus.spec.ts` liest das Verzeichnis beim Laden rekursiv und erzeugt je `.case` ein `test()`. Es gibt keinen Codegen und keinen Sync-Schritt — anders als beim Engine-Korpus ([ADR-0022](../adr/0022-datei-getriebener-engine-testkorpus.md)), wo `commonTest` keinen Laufzeit-Dateizugriff hat.

Die Prüfmechanik — Brettleser, Parser, Driftwächter unter `e2e/corpus/` — läuft als eigenes Playwright-Projekt `mechanik`; das Skript `test` startet beide Projekte. Ohne den zweiten Eintrag liefe sie in CI nicht mit, und eine Mechanik, die nie rot war, prüft nichts. Browser und Stack braucht sie nicht; sie kostet im E2E-Job trotzdem nichts, weil der Stack dort ohnehin schon steht, bevor Playwright startet.

Zwei Kostenzahlen, damit die nächste Entscheidung über einen teuren Fall nicht wieder gemessen werden muss — seriell, ein Worker, lokal: Grundkosten rund 300 ms je Fall, Grenzkosten rund 165 ms je Halbzug. Der teuerste Fall (Patt, 19 Halbzüge) liegt bei rund 3,4 s. Die Rüstzeit des Stacks übersteigt die Prüfzeit um ein Vielfaches — wer Laufzeit sparen will, sucht dort, nicht bei den Fällen.

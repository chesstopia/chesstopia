# E2E-Tests (Playwright)

Ebene 4 aus [ADR-0019](../docs/adr/0019-teststrategie.md): Durchstich durch Frontend, Backend und Datenbank. Alle Befehle laufen in `e2e/`.

## Einmalig

```bash
pnpm install
pnpm exec playwright install chromium   # firefox / webkit nur bei Bedarf
```

## Vor dem Lauf

Die Tests starten nichts selbst. Standardziel ist der Vite-Devserver auf `http://localhost:5173` (gesetzt in `.env`):

```bash
./gradlew :chesstopia-backend:bootRun    # im Repo-Wurzelverzeichnis
pnpm --filter chesstopia-frontend dev    # im Repo-Wurzelverzeichnis
```

Nach einem Branchwechsel oder Rebase vorher `./gradlew generateOpenApiClient` — sonst fehlt dem Client ein Header, und jeder Zug endet in 403.

## Tests laufen lassen

| Was | Befehl |
|---|---|
| Alles (Chromium + Mechanik) | `pnpm test` |
| Nur die Prüfmechanik, ohne Browser und Stack | `pnpm exec playwright test --project=mechanik` |
| Eine Datei | `pnpm exec playwright test tests/zwei-spieler.spec.ts --project=chromium` |
| Ein Test über die Zeile | `pnpm exec playwright test tests/gesten.spec.ts:11 --project=chromium` |
| Tests nach Namen | `pnpm exec playwright test -g "Schäfermatt" --project=chromium` |
| Nur die zuletzt roten | `pnpm test --last-failed` |
| Auf Wackeln prüfen | `pnpm exec playwright test tests/zwei-spieler.spec.ts --project=chromium --repeat-each=5` |
| Smoke allein | `pnpm run smoke` |

## Zuschauen und debuggen

| Was | Befehl |
|---|---|
| Headless (Standard) | `pnpm test` |
| Browser sichtbar (headed) | `pnpm test --headed` |
| UI-Modus: Testliste, Zeitleiste, Watch | `pnpm exec playwright test --ui` |
| Schrittweise im Inspector | `pnpm exec playwright test tests/smoke.spec.ts --project=chromium --debug` |

## Report und Trace

Jeder Lauf schreibt einen HTML-Report nach `playwright-report/` und pro Test einen Trace nach `test-results/`. Bei roten Tests öffnet sich der Report lokal von selbst.

```bash
pnpm exec playwright show-report                               # Report, Trace per Klick am Test
pnpm exec playwright show-trace test-results/<test>/trace.zip  # einen Trace direkt
```

Der Trace zeigt pro Schritt DOM, Screenshot, Netzwerk und Konsole — meist aufschlussreicher als ein Video.

## Anderes Ziel, andere Browser

```bash
PLAYWRIGHT_BASE_URL=http://localhost:8000 pnpm test   # lokaler Compose-Stack, Aufbau siehe unten
pnpm exec playwright test --project=firefox           # vorher: playwright install firefox
```

Eine gesetzte `PLAYWRIGHT_BASE_URL` hat Vorrang vor `.env`; so wählen CI und Deploy-Smoke ihr Ziel.

## Wenn es rot ist

| Meldung | Ursache |
|---|---|
| `ERR_CONNECTION_REFUSED` in jedem Browser-Test | Unter der Basis-URL läuft nichts — Backend und Vite starten oder `PLAYWRIGHT_BASE_URL` prüfen |
| 403 / „Kein gültiges Spieler-Token" | Veralteter API-Client — `./gradlew generateOpenApiClient` |

## Wo was liegt

| Ordner | Inhalt |
|---|---|
| `tests/` | Handgeschriebene Specs |
| `testcases/` | Schachsituationen als Dateien, ausgeführt von `tests/korpus.spec.ts` ([ADR-0029](../docs/adr/0029-datei-getriebener-e2e-korpus.md)) |
| `app/` | Zugriffsschicht: `Spieler`, Seiten, Komponenten — die einzige Stelle mit Playwright ([ADR-0030](../docs/adr/0030-schichtung-der-e2e-tests.md)) |
| `modell/` | Datenmodell ohne Playwright: Feld, Zug, Stellung, Brettbild |
| `korpus/` | Parser und Runner der Testfall-Dateien |
| `testlauf.ts` | `gruppe`, `szenario`, `pruefung`, `expect` und die Fixture `neuerSpieler` |

Compose-Stack, Pipeline und Stolperstellen: [docs/notes/e2e-aufbau.md](../docs/notes/e2e-aufbau.md).

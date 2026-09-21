---
type: adr
status: accepted
implementation: planned
updated: 2026-09-21
supersedes: []
verifies:
  - 'infra/roles/edge/templates/Caddyfile :: header_up -Origin'
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/config/WebSocketConfig.java :: addEndpoint("/ws")'
  - '.github/workflows/ci.yml :: backend-image'
  - '.github/workflows/ci.yml :: upload-artifact'
  - 'docker-compose.e2e.yml :: Caddyfile'
---

# ADR-0028: Artefakt-Kette in der CI, E2E gegen den Prod-Stack

## Status
Accepted. Löst Stufe 1 von [ADR-0027](0027-integrationsjob-baut-und-testet-die-images.md) ab und erfüllt dessen Stufe 2 in veränderter Form. Der Fan-out der reinen Prüfjobs aus [ADR-0011](0011-migration-nach-github-actions.md) und die Trennung von CI und Deployment bleiben unangetastet.

## Context
Die Pipeline baut dieselben Artefakte dreimal unabhängig: im Job `backend`, im Job `frontend` und ein drittes Mal im Job `integration`, der über `pnpmE2eTest` an `bootJar` und `pnpmFrontendBuild` hängt. ADR-0027 hat daraus die Konsequenz gezogen, die Images im Integrationsjob zu bauen — damit ist das getestete Jar das ausgelieferte. Die andere Hälfte blieb offen und ist in ADR-0027 nur als Randnotiz benannt: **Das ausgelieferte Jar hat die Backend-Testsuite nie gesehen.** `integration` baut `bootJar` ohne Tests, die Suite läuft im Nachbarjob auf einem unabhängig gebauten Jar. Dasselbe im Frontend — gelintet und mit Vitest geprüft wird ein anderes Bundle als das, was ins Image geht.

Die zweite Lücke liegt in der Betriebsschicht. E2E fährt heute gegen `java -jar` plus `vite preview`. Produktion fährt gegen nginx hinter Caddy. Das sind nicht nur andere Prozesse, sondern **andere Codepfade**: Die Caddyfile entfernt für `/api/*` den `Origin`-Header, das Backend sieht in Produktion also nie einen CORS-Request. Über den Vite-Preview sieht es einen, weshalb Port 4173 in die Origin-Allowlist von `SecurityConfig` aufgenommen werden musste. Geprüft wird der Pfad, den es in Produktion nicht gibt.

Was diese Lücke kostet, liegt offen im Repo: `WebSocketConfig` registriert den STOMP-Endpunkt `/ws`. Die Caddyfile kennt `handle /api/*` und einen Catch-All auf das Frontend — **eine Route für `/ws` gibt es nicht.** Ein Verbindungsversuch landet in Produktion im nginx. Keine der vier Teststufen kann das sehen. Es ist derselbe Fehler, den ADR-0027 im Kontext bereits einmal benennt.

Drittens hängt der E2E-Lauf im Build-Graphen dessen, was er testen soll. pnpm liegt unter `.gradle/`, `pnpmInstall` hängt an der JS-Distribution der Kotlin-Engine — der E2E-Job baut die Schach-Engine, um Playwright zu installieren.

Eine Randbedingung aus ADR-0011 ist inzwischen entfallen: Für GHCR ist eine Retention-Policy vorgesehen. Die Zahl der Images ist damit kein Argument mehr gegen Builds auf jedem Branch.

## Considered Options

- **Alles lassen.** Die Provenienzlücke zwischen Testsuite und Auslieferung ist theoretisch — gleicher Commit, gleiche Lockfiles, Unterschied sind Zeitstempel und Eintragsreihenfolge im Zip, nicht Verhalten. Verworfen, weil die zweite Lücke es nicht ist: Die Betriebsschicht hat nachweislich einen Fehler, den keine Teststufe sehen kann.

- **Ein Job je Komponente — bauen, testen, Image bauen und pushen in einem.** Kein Artefakt-Transport, kürzerer kritischer Pfad, zwei Jobs weniger. Verworfen wegen der Token-Reichweite: Der Job, der Gradle und pnpm mit allen Fremdabhängigkeiten ausführt, hielte gleichzeitig `packages: write`. Die Trennung macht den Angriff nicht unmöglich — ein vergiftetes Build-Plugin vergiftet das Jar, das der getrennte Image-Job hineinkopiert —, aber sie nimmt dem ausführenden Job die Fähigkeit, selbst zu pushen.

- **Getrenntes Package für ungeprüfte Images plus ein `promote`-Job**, der nach grünem E2E registry-seitig auf den deploybaren Tag kopiert. Macht E2E zu einem echten strukturellen Gate und hält Branch-Images aus dem Deploy-Pfad. **Zurückgestellt, nicht verworfen** — zusammen mit der Retention-Policy, zu der es gehört. Bis dahin trägt der manuelle Klick in `deploy.yml` das Gate.

- **Die Images als Tarball zwischen den Jobs reichen** (`docker save` / `docker load`) statt über die Registry. Bräuchte keine Registry-Schreibrechte auf Branches und keine Wegwerf-Tags. Verworfen: ein Vielfaches an bewegten Daten, ein zweiter Transportmechanismus neben dem, der ohnehin existiert, und der Registry-Roundtrip bliebe ungeprüft.

- **Eine abgeschriebene Zweitfassung der Caddyfile für CI.** Verworfen ohne Abwägung. Sie wäre genau die Stelle, an der eine veraltete Route stehen bliebe, während Produktion längst etwas anderes sagt — der Fall, der diesen Umbau ausgelöst hat.

- **E2E im pnpm-Workspace lassen.** Spart ein zweites Lockfile. Verworfen: Ein Black-Box-Client gehört nicht in den Build-Graphen dessen, was er testet, und der E2E-Job zahlt sonst einen Kotlin-Build für eine Playwright-Installation.

## Decision

Sechs Jobs, eine Kette je Komponente.

| Job | needs | Inhalt |
|---|---|---|
| `engine` | — | `chessEngineBuild` |
| `backend` | — | `:chesstopia-backend:build` → `upload-artifact` `app.jar` |
| `frontend` | — | `generateOpenApiClient`, Lint, Vitest, Build → `upload-artifact` `dist/` |
| `backend-image` | `backend`, `engine` | `download-artifact` → `buildx` → push |
| `frontend-image` | `frontend`, `engine` | `download-artifact` → `buildx` → push |
| `e2e` | beide Image-Jobs | `docker compose up` → Playwright |

**Jedes Artefakt entsteht genau einmal.** Das Jar wird im Job `backend` gebaut, dort von der Testsuite geprüft, als Artefakt übergeben und in dieser Form ins Image kopiert. `upload-artifact` ist eine bytetreue Übergabe; sie kann keine zweite Datei erzeugen. Was ADR-0027 gebrochen hat, war der doppelte Bau, nicht der Transport.

**Die Image-Jobs führen keinen Projektcode aus.** Sie laden ein Artefakt, rufen `buildx` und pushen. Nur sie tragen `packages: write`; die Build-Jobs haben keine Registry-Rechte.

**`engine` hängt in den `needs:` der Image-Jobs.** Die Engine-Testsuite läuft ausschließlich im Job `engine` — `backend` konsumiert nur die Jar-Task, `frontend` nur die JS-Distribution. Ohne diese Kante entstünde bei roter Engine-Suite ein Image. Da `engine` parallel zu `backend` läuft, wartet die Kette dadurch praktisch nicht länger.

**E2E fährt den Prod-Stack unter Compose.** `docker-compose.e2e.yml` ergänzt als Override über `docker-compose.prod.yml` genau das, was die Prod-Datei anderen Compose-Projekten überlässt: Postgres, Caddy und einen veröffentlichten Port. Die **produktive** Caddyfile und die **produktive** `nginx.conf` werden unverändert gemountet beziehungsweise sind im Image. `SITE_HOSTNAME` ist `http://localhost`, womit Caddy ohne TLS ausliefert; `{$SITE_HOSTNAME}` ist Caddys eigene Env-Syntax, kein Template. Damit laufen nginx, Caddy und das `prod`-Profil zum ersten Mal **vor** dem Deploy zusammen.

**Dasselbe Compose-File lokal und in CI.** Lokal baut es die Images, in CI zieht es sie. Der Entwickler fährt den Stack der Pipeline.

**`e2e/` verlässt den pnpm-Workspace** und bekommt ein eigenes Lockfile. Der Job braucht Node, `pnpm install --frozen-lockfile`, Playwright und Docker — kein Java, kein Gradle, keine Engine. Die Gradle-Tasks `pnpmE2eTest`, `playwrightInstallBrowsers` und `playwrightSmoke` entfallen; `deploy.yml` ruft Playwright direkt.

**Ein Package je Komponente, ein Tag je Commit, auf jedem Branch.** Der Tag ist der 7-stellige Short-SHA. `docker-compose.prod.yml` und `deploy.yml` bleiben unverändert.

**Das Kriterium für `fullyParallel` wechselt** von „die Basis-URL kommt von außen" auf „die Umgebung ist geteilt". In der neuen Pipeline kommt die URL immer von außen, auch für den Wegwerf-Stack in CI, der sehr wohl parallel laufen soll. Seriell bleibt nur der Smoke gegen Produktion.

**Das Deployment bleibt ein eigener Workflow.** CI erzeugt deploybare Tags, `deploy.yml` verbraucht sie, wenn ein Mensch klickt. Rollback und Redeploy ohne Rebuild bleiben derselbe Knopf.

## Consequences

- **Die Provenienz ist geschlossen.** Das von der Testsuite geprüfte Jar ist das ausgelieferte Jar; das gelintete und mit Vitest geprüfte Bundle ist das ausgelieferte Bundle. Beides galt vorher nicht.
- **Der Registry-Roundtrip ist mitgeprüft.** E2E zieht die Images aus GHCR, statt lokal Gebautes zu testen. Manifest, Layer und Plattform sind damit belegt.
- **E2E ist kein Gate.** Die Images sind gepusht und deploybar, bevor Playwright startet; ein roter Lauf hinterlässt ein deploybares Image. Was das auffängt, ist der Mensch an `deploy.yml`. **Benannte Schuld** — der `promote`-Job oben schließt sie, wenn die Retention-Policy kommt.
- **Images von Feature-Branches sind deploybar.** Dieselbe Schuld, dieselbe Auflösung.
- **Fork-PRs sind strukturell rot.** Ihr `GITHUB_TOKEN` ist read-only, die Image-Jobs können nicht pushen, und ohne Images läuft kein E2E. Bei Committern mit Write-Access im selben Repo folgenlos — aber es ist eine Zusage, keine Nebensache.
- **Der kritische Pfad wird länger:** `backend` → `backend-image` → `e2e` statt vier paralleler Jobs. Gemessen ist davon nichts; ein Compose-Stack kommt anders hoch als `java -jar`. Auf einem public Repo sind es Wanduhr-Minuten, keine Kosten.
- **Ein lokaler E2E-Lauf braucht ab jetzt Docker.** Vorher genügten ein Jar, ein Node-Prozess und ein Postgres-Container. Das ist der Preis dafür, dass lokal und CI dasselbe prüfen.
- **Zwei Konfigurationen werden gegenstandslos** und werden im selben Zug entfernt: der Eintrag `http://localhost:4173` in der Origin-Allowlist von `SecurityConfig` und `preview.proxy` in `vite.config.ts`. E2E ist hinter Caddy same-origin und braucht beides nicht mehr. Wer sie stehen lässt, hält einen Pfad am Leben, den nichts mehr prüft.
- **Die fehlende `/ws`-Route in der Caddyfile ist damit sichtbar, aber nicht behoben.** Sie bekommt ein eigenes Ticket, und der Test dafür braucht zusätzlich einen Frontend-Client, den es noch nicht gibt. **Benannte Lücke, kein geschlossener Kreis.**
- **Die Engine wird weiterhin dreimal gebaut** — im eigenen Job, transitiv in `backend`, transitiv in `frontend`. Das aufzulösen bräuchte einen jobübergreifenden Cache-Schlüssel, der bei einem Miss still danebengreift, oder eine Artefakt-Übergabe, die mit der Koordinaten-Substitution des Composite Builds ([ADR-0006](0006-build-orchestration.md)) kollidiert. Doppelte CPU auf freien Minuten ist der billigere Fehler.
- **Der Check-Name ändert sich erneut.** Aus `integration (E2E + Images)` werden sechs Jobs; die Required Status Checks auf `main` müssen das nachvollziehen, sonst hängt jeder PR an einem Check, der nie wieder meldet.

---
type: adr
status: accepted
# `partial`, weil dieses ADR beide Stufen entscheidet, aber zum Zeitpunkt des
# Schreibens nur Stufe 1 gebaut ist. Task 11 zieht es auf `complete`. Das Feld
# ist Zustand und damit das einzige, was an einem ADR später geändert werden
# darf — der Körper ist append-only.
implementation: partial
updated: 2026-09-12
supersedes: []
verifies:
  - '.github/workflows/ci.yml :: integration (E2E + Images)'
  - '.github/workflows/ci.yml :: needs: [chess-engine, backend, frontend, integration]'
---

# ADR-0027: Der Integrationsjob baut und testet die Images, ein Gate promotet sie

## Status
Accepted. Ändert die Job-Topologie aus [ADR-0011](0011-migration-nach-github-actions.md), ohne deren Begründung aufzuheben: Fan-out der Prüfjobs, unbegrenzte Minuten, kein jobübergreifender Cache-Schlüssel — alles das gilt weiter.

## Context
Das ausgelieferte Image enthielt nachweislich nicht das getestete Artefakt. Das Backend-Jar entstand zweimal unabhängig — im Job `backend`, dessen Artefakt der Job `images` herunterlud, und im Job `e2e`, wo `pnpmE2eTest` an `:chesstopia-backend:bootJar` hängt. Ein Boot-Jar ist nicht bit-reproduzierbar; zwei Builds ergeben zwei verschiedene Dateien.

Zugleich war der Image-Bau an `if: main` gebunden. Ein kaputtes Dockerfile fiel deshalb frühestens nach dem Merge auf, nie im PR.

Und die Betriebsschicht — nginx, Caddy, das `prod`-Profil — hatte überhaupt keine Testebene vor dem Deploy. `deploy.yml` war die einzige Stelle, an der diese drei je zusammen liefen, per Smoke gegen die Produktion, **nach** dem Rollout. Der Beleg liegt auf `origin/CHESS-19_Implement-Partie`: `handle /ws/*` matchte kein blankes `/ws`, der WebSocket-Upgrade landete im SPA-Container. Lokal und in CI unsichtbar, weil Vite dort proxyt.

## Decision
Der Job `images` entfällt. Der bisherige `e2e`-Job heisst `integration` und baut beide Images aus demselben Workspace, in dem er gerade E2E gefahren ist — auf **jedem** Branch, mit `push: false`. Damit sind getestetes und ausgeliefertes Jar dieselbe Datei, und ein kaputtes Dockerfile fällt im PR auf.

„Ein roter Durchstich verdient kein Image" gilt weiter, wandert aber von `needs:` in die Schrittreihenfolge: Der Image-Bau steht hinter dem E2E-Schritt.

Das Gate der drei Prüfjobs bleibt ein `needs:`, sitzt aber in einem eigenen, sehr kleinen `push`-Job. Auf `main` pusht der Integrationsjob einen provisorischen Tag `ci-<voller SHA>`; `push` promotet ihn mit `docker buildx imagetools create` registry-seitig auf den endgültigen 7-stelligen Short-SHA. Es wird dabei kein Layer bewegt und nichts neu gebaut.

`deploy.yml` nimmt ab jetzt ausschliesslich 7 Hex-Zeichen als Tag an. Das schliesst den provisorischen Tag aus und schliesst nebenbei ein Loch, das vorher schon bestand: `docker manifest inspect` prüft Existenz, nicht Freigabe.

Beide `upload-artifact`- und beide `download-artifact`-Schritte entfallen ersatzlos.

**Zweite Stufe, hier mitentschieden und getrennt gebaut:** Der E2E-Lauf wechselt von „Jar plus `vite preview`" auf den Container-Stack. `docker-compose.ci.yml` ergänzt als Override über `docker-compose.prod.yml` genau das, was die Prod-Datei bewusst anderen Compose-Projekten überlässt — Postgres, Caddy und einen veröffentlichten Port —, ohne `backend` und `frontend` zu wiederholen. Die **produktive** Caddyfile wird dabei unverändert gemountet; sie ist kein Jinja-Template, und `{$SITE_HOSTNAME}` ist Caddys eigene Env-Syntax. Eine abgeschriebene Zweitfassung ist ausdrücklich ausgeschlossen: Sie wäre genau die Stelle, an der eine veraltete Route stehen bliebe, während Produktion längst etwas anderes sagt — der Fall, der diesen Umbau ausgelöst hat.

Damit laufen nginx, Caddy und das `prod`-Profil zum ersten Mal **vor** dem Deploy zusammen, statt nur im Smoke danach. Der Postgres-Service-Container des Jobs entfällt in dieser Stufe, weil `application-prod.yml` fest auf den Hostnamen `postgres` im Compose-Netz zeigt.

## Alternatives considered
**`needs: [chess-engine, backend, frontend]` direkt am Integrationsjob.** Einfacher, keine Fremdtags. Kostet aber auf **jedem** Branch rund 70 Sekunden, für eine Garantie, die nur auf `main` zählt, und unterdrückt das E2E-Ergebnis vollständig, sobald ein Prüfjob rot ist. Verworfen, weil die schnelle Rückmeldung im PR der häufigere Fall ist.

**Das Image als Tarball-Artefakt an den `push`-Job reichen.** Bitgenaue Provenienz ohne Fremdtags, aber ein Vielfaches an übertragenen Daten durch `upload-artifact` und wieder zurück, plus `docker save`/`docker load` — mehr bewegliche Teile bei schlechterer Laufzeit. Verworfen.

**Die Engine vor backend/frontend sequenzieren.** Verworfen, und zwar ohne Schätzung: Der Job `chess-engine` baut JVM *und* JS *und* fährt die Engine-Testsuite — strikt mehr, als die abhängigen Jobs brauchen. Der Engine-Anteil in `backend`/`frontend` ist damit per Definition kleiner als die Wartezeit, die eine Sequenzierung erzwänge. Eine Übergabe bräuchte ausserdem entweder einen jobübergreifenden Cache-Schlüssel (kann still danebengreifen) oder ein Artefakt — und letzteres kollidiert mit der Koordinaten-Substitution des Composite Builds ([ADR-0006](0006-build-orchestration.md)) und mit dem `workspace:*`-Link, dessen `main` auf einen internen Gradle-Ausgabepfad zeigt.

## Consequences
- **Der kritische Pfad wird länger, die Gesamtzeit kaum.** Der erste Lauf der neuen Topologie auf einem Branch brauchte im Integrationsjob 172 s; der alte `e2e`-Job lag bei 168–177 s. Der Image-Bau beider Images geht darin unter — auf Branches fand er vorher überhaupt nicht statt. Die Laufzeit auf `main` inklusive Promotion ist noch nicht gemessen; sie kommt mit dem ersten Merge.
- **Auf `main` steht je Commit ein provisorischer Tag in GHCR**, bis der Aufräumschritt ihn entfernt. Der Schritt ist `continue-on-error` — schlägt er fehl, bleibt ein Fremdtag stehen, deploybar wird er dadurch nicht.
- **Der Check-Name hat sich geändert.** `e2e (Playwright)` heisst `integration (E2E + Images)`; die Required Status Checks auf `main` müssen das nachvollziehen, sonst hängt jeder PR an einem Check, der nie wieder meldet.
- **Der Job `backend` bleibt unverzichtbar.** `integration` baut nur `bootJar`; die Backend-Testsuite läuft ausschliesslich dort. Wer `backend` streicht, verliert sie.
- **Der CI-Stack braucht Zugangsdaten, die es in CI vorher nicht brauchte.** Das `prod`-Profil löst `${POSTGRES_PASSWORD}` auf und bricht unbelegt beim Start ab. Der Wert wird im Workflow zur Laufzeit erzeugt und lebt so lange wie der Job — im Repo steht er nicht (Verbot 6).
- **Die SPA-Rückfallregel bleibt ungeprüft.** `try_files` in `nginx.conf` berührt kein Spec, weil keiner der Tests einen Tiefenlink aufruft. Benannte Lücke, kein geschlossener Kreis.

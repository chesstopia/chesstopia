---
type: adr
status: partially-superseded
implementation: partial
supersedes: []
---

# ADR-0010: Deployment- & CI/CD-Infrastruktur

## Status
Accepted — teilweise überholt durch [ADR-0011](0011-migration-nach-github-actions.md). Die Zwei-Box-Topologie (Infra-Box mit self-hosted Runner + private Registry) und die Bitbucket-Deploy-Mechanik gelten nicht mehr — die Infra-Box ist gelöscht. Weiter gültig: die drei Compose-Stacks nach Eigentümergrenze, das externe Netz, Caddy/Same-Origin, Hash-Pinning ohne `latest`, das `prod`-Spring-Profil und Ansible als rein lokales Provisioning-Werkzeug.

## Context
ADR-0009 etablierte eine reine Build-/Test-Pipeline (Bitbucket Cloud) ohne Deploy/Publish. Jetzt soll Chesstopia tatsächlich auf eigener Hardware laufen. Vorhanden sind **zwei Hetzner-VPS**: eine mit **4 GB RAM / 2 CPU** (Prod) und eine mit **8 GB RAM / 4 CPU** (Infra). Mehrere harte Randbedingungen prägen das Design:

1. **Der Monorepo-Build ist speicherhungrig.** ADR-0009 nennt `size: 2x` (8 GB) als OOM-Hebel für den Composite-Build (Kotlin-MP + Spring-Tests + pnpm-Frontend). Auf der 4-GB-Prod-Box zu bauen würde die Produktiv-Maschine bei jedem Deploy an die RAM-Wand fahren.
2. **Stockfish (ADR-0005, MoveEngine) ist die latenzkritische Dauerlast** auf der Prod-Box — CPU-gebunden, multi-threaded.
3. **Bitbucket Cloud Free Tier = 50 Build-Minuten/Monat** — für einen mehrminütigen Composite-Build schnell erschöpft.
4. **Auth nutzt HttpOnly-Cookies (ADR-Memory):** `Secure`-Cookies werden über plain HTTP nicht gesendet → echtes HTTPS ist von Anfang an nötig, auch ohne gekaufte Domain.

## Decision

### Topologie: Build/Registry getrennt vom Betrieb
- **Infra-Box (8 GB):** self-hosted Bitbucket Runner **+** Container-Registry (`registry:2`).
- **Prod-Box (4 GB):** ausschließlich die laufende App (Caddy, Backend, Frontend, Postgres, später Stockfish).

Bauen und Betreiben werden auf getrennte Maschinen gelegt, weil der Build periodisch bis zu 8 GB spitzt und sonst die laufende Prod-Postgres OOM-killen könnte. Der Build bekommt die 8-GB-Box, der Betrieb bleibt ungestört.

### Drei Compose-Stacks nach Eigentümer-Grenze: persistent = Ansible, App = Pipeline
Auf der Prod-Box laufen **drei getrennte Compose-Stacks**, die ein gemeinsames externes Docker-Netz `chesstopia` teilen:

| Stack | Pfad | Inhalt | Deployt von |
|---|---|---|---|
| `db` | `/opt/chesstopia-db/` | Postgres + `pgdata`-Volume | **Ansible** |
| `edge` | `/opt/chesstopia-edge/` | Caddy + Caddyfile + `caddy_data`-Volume | **Ansible** |
| `app` | `/opt/chesstopia/` | Backend + Frontend (Images) | **Pipeline** |

Das Ordnungsprinzip: **Persistente/zustandsbehaftete Infrastruktur gehört zu Ansible, zustandslose pro-Hash-versionierte App-Images zur Pipeline.** `pgdata` (DB-Daten) und `caddy_data` (ACME-Zertifikate) sind dieselbe Kategorie kostbaren Zustands — nichts, was eine App-Pipeline bei jedem `main`-Merge anfassen darf. Der Pipeline-Deploy-Step managt deshalb ausschließlich die zwei stateless App-Container; er fasst weder TLS noch Zert-Store noch DB an und kann den öffentlichen Eingang strukturell nicht abschießen.

**Netzwerk:** Ein einmal angelegtes externes Netz `chesstopia` (Ansible-Task, vor allen Stacks). Alle Container hängen daran und erreichen einander über den eingebauten Docker-DNS per Servicenamen — projektübergreifend (`jdbc:postgresql://postgres:5432/…`, Caddy `reverse_proxy backend:8080`). Caddy braucht **kein** Cross-Projekt-`depends_on`: `reverse_proxy` toleriert ein noch nicht gestartetes Upstream (502 + Retry), Startreihenfolge zwischen Stacks ist egal.

### Variante A: CI baut → Registry → Prod pullt
Images werden **in der Pipeline** gebaut und in die Registry gepusht; die Prod-Box macht nur `pull` + `up`. Kein `build:` auf der Prod-Box (Randbedingung 1). Images entstehen per **Artefakt-Copy**: die Pipeline baut mit Gradle/pnpm (warmer Cache aus ADR-0009), das Dockerfile **kopiert nur** das fertige Artefakt — einstufig, kein Build im Docker-Layer.

- **Backend:** `app.jar` (fixer `bootJar`-Name, Plain-Jar deaktiviert) in `eclipse-temurin:25-jre`, non-root (`spring`-User). Die Stockfish-Binary (ADR-0005) ist **noch nicht** im Image — die server-seitige MoveEngine ist noch nicht implementiert. Sie wird **additiv** (`apt-get install`) ergänzt, sobald sie landet; Base-Image und Copy-Strategie bleiben unverändert. (Damit ist der Wortlaut-Konflikt mit ADR-0005 — „kein reines JVM-Image" — bewusst aufgelöst: reines JRE-Image jetzt, Stockfish später.)
- **Frontend:** Vite-`dist/` in `nginx:alpine`, eigenes git-hash-getaggtes Image, mit SPA-Fallback (`try_files … /index.html`).

### Versionierung: nur Git-Short-Hash
Image-Tags sind **ausschließlich** der kurze Git-Hash (`$BITBUCKET_COMMIT_SHORT`) — kein Semver, **kein** wandernder `latest`-Tag (eine einzige Wahrheit, deterministisches Rollback). Backend- und Frontend-Image tragen denselben Hash → atomares Deploy/Rollback. Die `docker-compose.prod.yml` referenziert `${IMAGE_REGISTRY}/…:${IMAGE_TAG}`; `IMAGE_REGISTRY` kommt aus der `.env`, `IMAGE_TAG` setzt der Deploy-Step zur Laufzeit (Shell-Env schlägt `.env`-Default).

### Same-Origin: Caddy terminiert TLS und routet
Frontend und Backend laufen unter **derselben Origin** (`https://<host>.sslip.io`). Caddy (Compose-Service im `edge`-Stack, einziger mit öffentlichen Ports 80/443) routet `/api/*` → `backend:8080` (Prefix wird **nicht** gestrippt, Backend-Routen liegen bereits unter `/api/v1/…`), alles andere → `frontend:80`. Das Frontend-Image ist damit **generisch** (kein eingebackener Hostname, „Domain später eintauschbar"), und die `Secure` HttpOnly-Cookies sind automatisch same-origin (kein CORS). TLS via **sslip.io + Let's Encrypt** (ACME HTTP-01 auf Port 80), Hostname per `SITE_HOSTNAME`-Variable. Die Caddyfile ist env-getrieben (`{$SITE_HOSTNAME}`) und im Repo eincheckbar; `caddy_data` **muss** ein Named Volume sein, sonst werden bei jedem Redeploy neue Zertifikate angefordert (Let's-Encrypt-Rate-Limit).

### Netzwerk & Registry-Absicherung
**Hetzner Private Network** zwischen beiden Boxen; Registry-Pull und Deploy-SSH laufen über das interne Interface, nicht übers öffentliche Netz. Die Registry lauscht auf `infra_private_ip:5000` (`10.0.0.3:5000`) — **nicht** auf localhost. Der Runner pusht als Sibling-Container auf dem Infra-Daemon dorthin; deshalb braucht **auch die Infra-Box** `10.0.0.3:5000` in `insecure-registries` (nicht nur Prod fürs Pullen). Die Registry läuft fürs Erste **insecure & ohne Auth** auf dem privaten Interface — bewusst pragmatisch, später per TLS + Auth härtbar. Kein `docker login` im Deploy.

### Deployment: Pipeline shipt App-Compose, getriggert per SSH
Der Deploy-Step (`scp docker-compose.prod.yml deploy@prod:/opt/chesstopia/` → `ssh deploy@prod 'cd /opt/chesstopia && IMAGE_TAG=<hash> docker compose pull && up -d'`) läuft über das private Netz. Die `.env` mit Prod-Secrets liegt **nur** auf der Prod-Box (Ansible-gerendert), nie auf Clients; die Pipeline schreibt sie nie. **build + push laufen automatisch auf `main`, der Deploy-Step ist `trigger: manual`** (menschliches Gate vor der einzigen Prod-Umgebung). Build/Push passieren **nur auf `main`** — Feature-Branches und PRs bleiben reiner Build/Test (sonst füllt sich die Registry mit Wegwerf-Images). Struktur auf `main`: chess-engine → parallel(backend, frontend, mit `artifacts:`) → `package & push` (eigener Step, `services: docker`, baut beide Dockerfiles aus den Artefakten) → `deploy` (manuell). Der Deploy-SSH-Key liegt auf der Infra-Box (in den Runner gemountet), nicht als Bitbucket-Variable. `DEPLOY_HOST`/`IMAGE_REGISTRY` stehen hart in der Pipeline-YAML (nicht geheim, in der Inventory ohnehin vorhanden). Gesamte Pipeline läuft self-hosted (`runs-on: [self.hosted, linux]`, seriell).

**Host-Key-Pinning per Ansible (kein TOFU):** Der Baseline-Play liest Prods `ssh_host_ed25519_key.pub` (Fact), der Infra-Play rendert daraus eine `known_hosts`-Datei und mountet sie in den Runner. Der Deploy-Step nutzt `StrictHostKeyChecking=yes` gegen diese Datei. Trust-Pfad identisch zum Deploy-Key (Infra→Prod) — nur in Gegenrichtung, einmal beim Provisioning statt bei jedem Deploy.

### Backend-Laufzeit: dediziertes `prod`-Profil
Das Default-Profil (`application.yml`) ist ein **Dev**-Profil (localhost-DB, `show-sql`, DEBUG) und darf nie in Prod laufen. `application-prod.yml`, aktiviert über `SPRING_PROFILES_ACTIVE=prod` (im Compose fest gesetzt), zeigt die Datasource auf den Service `postgres`, liest Creds aus denselben `POSTGRES_*` wie der DB-Stack (eine Quelle der Wahrheit), schaltet `show-sql` aus und Logging auf INFO. **Flyway** migriert beim Start gegen die Prod-DB (kein `ddl-auto`). Heap gedeckelt via `-XX:MaxRAMPercentage=75.0` + `mem_limit: 1536m`; Postgres bewusst **ohne** Hard-Limit (OOM-Kill mitten im Schreibvorgang wäre schlimmer als Swap-Nutzung).

### Provisioning: Ansible, rein lokal
Ansible (agentless) läuft vom Laptop als Control Node; **kein Ansible-Server**. Provisioning ist bewusst **nicht** in der Pipeline (selten, hochprivilegiert, manuell verantwortet). Account-Anlegen ist Teil der Scripts: root-SSH gesperrt, personalisierte Admins (sudo), ein unprivilegierter `deploy` (docker-Gruppe). Prod-Secrets via **Ansible Vault** → gerenderte `.env` pro Stack (`db` und `app` bekommen die geteilten `POSTGRES_*` aus **einem** Vault). Aufgabenteilung: **Ansible richtet die Box ein und betreibt die persistenten Stacks (`db`, `edge`); die Pipeline deployt den App-Stack.** Alles im Monorepo (`infra/` für Ansible, `docker-compose.prod.yml` im Repo-Root-Kontext).

## Consequences
- **CPU-Allokation invertiert:** Die bursty Build-Last bekommt 4 Kerne, die latenzkritische Stockfish-Dauerlast nur 2 — bekannter, akzeptierter Trade-off. Wenn KI-Denkzeiten ruckeln, ist das der erste Verdächtige.
- **Ein Runner ⇒ serielle Steps:** Der `parallel`-Block (backend/frontend) aus ADR-0009 wird auf dem self-hosted Runner nacheinander abgearbeitet. Echte Parallelität bräuchte mehrere Runner.
- **Self-hosted = Wartungslast:** Runner-Agent, JDK 25, Docker auf der Infra-Box müssen gepflegt und abgesichert werden.
- **Drei Stacks statt einem:** mehr bewegliche Teile (zwei Ansible-Rollen `db`/`edge` + das externe Netz), dafür glasklare Eigentümer-Grenze. Die **Routing-Config (Caddyfile) lebt getrennt vom Code** — ein neuer Pfad-Prefix ist eine Ansible-Änderung + `site.yml`-Run, kein Repo-Commit, der atomar mitfliegt. Bei stabilem Routing (`/api/*`-Split) vernachlässigbar.
- **Prod-Box bleibt knapp (4 GB):** JVM-Heap (`MaxRAMPercentage` + `mem_limit`) gedeckelt, Swap (4 GB, `swappiness=10`) ist Pflicht, Postgres-Port wird nie veröffentlicht.
- **`down -v`-Disziplin:** DB und App in getrennten Compose-Projekten verkleinern den Blast-Radius (ein `down -v` im App-Projekt erreicht `pgdata` nicht mehr), ersetzen aber kein Backup. Echter Schutz kommt erst mit dem Backup.
- **Backups off-box, aber schwach:** täglicher `pg_dump` + rsync auf die Infra-Box — kein echter Geo-/Provider-Schutz (beide Boxen, ein Rechenzentrum). Upgrade-Pfad: restic → Hetzner Storage Box. Restore muss geübt werden. (Noch nicht verdrahtet.)
- **insecure-Registry** ist eine bewusste Anfangsschuld, abgesichert nur durchs private Netz; **beide** Box-Daemons (Infra zum Pushen, Prod zum Pullen) tragen sie in `insecure-registries`.

## Verworfene Alternativen
- **DB (und/oder Caddy) im App-Compose, von der Pipeline deployt.** Eine Compose-Datei weniger, aber vermischt persistenten Zustand (`pgdata`, `caddy_data`) mit dem zustandslosen App-Deploy: die bei jedem `main`-Merge feuernde Pipeline würde DB und Zert-Store anfassen. Verworfen zugunsten der Eigentümer-Grenze (persistent → Ansible, App-Images → Pipeline).
- **Wandernder `latest`-Tag, Compose referenziert `latest`.** Bequem, aber bricht das Hash-Pinning: kein deterministisches Rollback, `pull` nicht reproduzierbar. Verworfen.
- **Absolute Backend-URL ins Frontend bauen (`VITE_API_URL`).** Bindet das Image an einen Hostnamen (Neubau beim Domain-Wechsel), erzwingt CORS und macht Cookies cross-origin-empfindlich. Verworfen zugunsten Same-Origin `/api` via Caddy.
- **Host-Key-TOFU (`StrictHostKeyChecking=accept-new`) im Deploy.** Einfacher, aber vertraut beim ersten Kontakt blind. Verworfen zugunsten Ansible-gepinntem `known_hosts` (gleicher Trust-Pfad wie der Deploy-Key).
- **Bitbucket Cloud-Runner + managed Registry (GHCR/Docker Hub) + eine 8-GB-Box für die App.** Technisch sauberer: Build-RAM-Problem entfällt, die App bekäme 8 GB/4 CPU (gut für Stockfish), keine Runner-/Registry-Wartung. Verworfen, weil die Kosten ≈ self-hosted sind und der **Lerneffekt** eigener Infrastruktur ausdrücklich gewünscht ist.
- **Auf der Prod-Box bauen (`docker compose build`).** Verworfen — Build spitzt auf bis zu 8 GB und würde die laufende Prod-Postgres gefährden (Randbedingung 1).
- **`docker context` über SSH** (Compose-Datei lokal, Daemon remote). Eleganter „single source", aber Compose interpoliert Variablen client-seitig → Prod-Secrets müssten auf Runner *und* jedem Dev-Laptop liegen. Verworfen wegen Secret-Lokalität.
- **Self-hosted Runner auf der 4-GB-Box.** Verworfen — unter dem dokumentierten 8-GB-Bedarf, OOM/Swap-Thrash-Risiko.
- **Separates Infra-Repo.** Verworfen zugunsten eines Monorepos (Team-Präferenz); reine `infra/`-Änderungen werden per pfad-basiertem Pipeline-Trigger vom App-Build entkoppelt.
</content>
</invoke>

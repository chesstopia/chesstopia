# ADR-0011: Migration nach GitHub Actions & GHCR

## Status
Accepted — überschreibt Teile von ADR-0009 (CI-Pipeline) und ADR-0010 (Deployment-/CI-CD-Infrastruktur).

## Context
Chesstopia lag auf Bitbucket Cloud. ADR-0009 baute darauf eine Build-/Test-Pipeline, ADR-0010 eine Zwei-Box-Topologie: eine 8-GB-**Infra-Box** (self-hosted Runner + private `registry:2` auf `10.0.0.3:5000`) und eine 4-GB-**Prod-Box** (nur die App). Beide ADRs sind mit ihren damaligen Prämissen korrekt begründet — und **genau diese Prämissen sind entfallen**:

1. **„Bitbucket Free = 50 Build-Minuten/Monat"** (ADR-0009 §Context, ADR-0010 Randbedingung 3). Bei einem **public** GitHub-Repo sind Actions-Minuten auf GitHub-hosted Standard-Runnern unbegrenzt. Doppelte Build-Arbeit kostet nichts mehr.
2. **„Der Monorepo-Build spitzt auf bis zu 8 GB"** (ADR-0010 Randbedingung 1) — *das* Gründungsargument der Infra-Box, weil Bitbuckets Standard-Step nur 4 GB hatte. GitHub-hosted Runner für public Repos haben **4 vCPU / 16 GB**. Der Build passt mit Reserve, ohne eigene Hardware.
3. **„Ein Runner ⇒ serielle Steps"** (ADR-0010 §Consequences). GitHub-hosted Jobs laufen jeweils auf einer eigenen VM — Parallelität ist zum ersten Mal echt.
4. **Die Infra-Box ist bereits gelöscht.** Damit existiert die private Registry nicht mehr, `IMAGE_REGISTRY` in prods `.env` zeigt ins Leere und **es ist aktuell kein Deploy möglich**. Diese Migration ist kein Aufräumen, sondern der Weg zurück zu einer funktionierenden Pipeline.

Die Prod-Box (4 GB, Caddy + Backend + Frontend + Postgres) bleibt unverändert bestehen.

## Decision

### Repo ist public — die Wurzel aller anderen Entscheidungen
Das GitHub-Repo liegt public unter der Organisation **`chesstopia`**. Public ist hier keine ideologische, sondern eine **ökonomische und technische** Entscheidung: unbegrenzte Actions-Minuten, 16-GB-Runner (löst Randbedingung 1 endgültig), gratis GHCR-Storage, gratis Environments für das Deploy-Gate. Auf dem Free-Plan für *private* Repos wäre nichts davon gegeben (2.000 min/Monat, 7-GB-Runner, 500 MB Package-Storage, Environment-Schutzregeln nur mit Pro/Team).

**Was public nicht bedeutet:** GitHub-Secrets bleiben verschlüsselt und sind nicht lesbar. Fork-PRs erhalten **keine** Secrets und nur ein read-only `GITHUB_TOKEN`. `pull_request_target` und `workflow_run` (die Trigger, die fremden Code im Kontext des Basis-Repos ausführen können) werden **nicht** verwendet. Die reale Vertrauensgrenze ist **Write-Access**: wer pushen darf, kann per Workflow jedes Secret auslesen.

**Ansible Vault bleibt im Repo.** Die beiden `vault.yml` waren nie im Klartext in der Historie. Ansible Vault leitet den Schlüssel per PBKDF2-HMAC-SHA256/10.000 Iterationen ab — schwach nach heutigen Maßstäben, aber die verwendete 30-Zeichen-Passphrase mit Sonderzeichen liegt weit außerhalb dessen, was offline brute-forcebar ist. Die Prod-Secrets werden daher **nicht** rotiert. `group_vars/infra/vault.yml` (Bitbucket-Runner-Credentials) wird gelöscht.

### Registry: GHCR mit public Packages
Images liegen unter `ghcr.io/chesstopia/chesstopia-{backend,frontend}:<short-sha>`. Push aus Actions mit dem automatischen `GITHUB_TOKEN` (`packages: write`), **kein PAT**. Prod pullt **anonym über HTTPS** — kein `docker login` auf der Box, kein Credential, das rotiert werden müsste.

Damit entfällt ersatzlos: die private `registry:2`, `insecure-registries` in beiden Docker-Daemons, das Custom-**dind**-Image mit `--insecure-registry`, das Custom-**Deploy**-Image, die `services: docker`-Konstruktion. Die „bewusste Anfangsschuld" aus ADR-0010 (insecure Registry im Privatnetz) ist nicht gehärtet, sondern **verschwunden**.

### Zwei Workflows: `ci.yml` und `deploy.yml`
```
ci.yml            on: pull_request | push:main
  engine ∥ backend ∥ frontend        (Fan-out, kein needs:)
        └──────┬──────┘
               ▼  (nur main)
            images                    docker/build-push-action → GHCR

deploy.yml        on: workflow_dispatch { tag }
            deploy                    environment: production
```

**Fan-out statt Cache-Warmup-Kette — dies kehrt ADR-0009 bewusst um.** ADR-0009 stellte `chess-engine` als Stage 1 *vor* backend/frontend, damit diese Cache-Hits auf die Engine-Tasks bekommen. Der Zweck war, doppelte Arbeit zu vermeiden, weil Minuten Geld kosteten. Bei unbegrenzten Minuten und echter Job-Parallelität ist der Tausch anders herum richtig: die drei Jobs laufen **gleichzeitig**, jeder baut die Engine transitiv für sich mit (Composite Build bzw. `pnpmInstall`-Kette, ADR-0006 bleibt unangetastet). Das kostet redundante CPU-Zeit (die nichts kostet), spart aber die serielle Vorstufe **und** die handgepflegte Cache-Choreografie zwischen Jobs — ein Mechanismus, der bei einem Key-Miss still degradiert. Der **Dependency**-Cache (Gradle-Module, pnpm-Store, node-Binaries; keyed auf die Lockfiles) bleibt und wirkt über Runs hinweg.

Die Komponenten-Trennung im UI — das eigentliche Ziel von ADR-0009 — bleibt damit erhalten.

**`generateOpenApiClient` läuft ab jetzt im Frontend-Job.** ADR-0009 hatte das als „latente Abhängigkeit" notiert: der Task steckte nur in `buildAll`, nicht in der Pipeline. Sobald das Frontend `@chesstopia/openapi-client` importiert, wäre die Pipeline rot geworden. Wird hier mitrepariert.

**Der `useradd builder`-Hack entfällt.** Bitbuckets Container liefen als root, Zonkys Postgres-Binaries (ADR-0008) verweigern das — daher die Konstruktion mit unprivilegiertem Nutzer und umgebogenem `GRADLE_USER_HOME`. GitHub-hosted Runner laufen ohnehin als unprivilegierter `runner`. Ersatzlos gestrichen.

### Deployment: eigener Workflow, `workflow_dispatch` mit Tag-Input
Das Deployment ist **kein Job der CI-Kette**, sondern eine eigene Workflow-Datei mit einem Eingabefeld für den Image-Tag (Default: aktueller `main`). Der Klick auf „Run workflow" ersetzt Bitbuckets `trigger: manual` — derselbe Aufwand wie ein Approval, aber **Rollback ist derselbe Knopf** (alten Hash eintragen). Redeploy ohne Rebuild wird dadurch überhaupt erst möglich.

Der Job läuft in einem GitHub-**Environment** `production`. Das Environment ist kein Zeremoniell: es **scoped das SSH-Secret** (Branch-Regel `main`), sodass kein Workflow auf einem Feature-Branch und kein PR es lesen kann, und liefert nebenbei die Deployment-Historie.

Mechanik unverändert gegenüber ADR-0010: `scp docker-compose.prod.yml` → `ssh deploy@prod 'IMAGE_TAG=<hash> docker compose pull && up -d'`. Nur der Weg ist neu — statt über das Hetzner-Privatnetz jetzt über das öffentliche Internet.

- **Deploy-Key:** lokal erzeugtes ed25519-Keypair. Public Key in `group_vars/all.yml` (`deploy_ssh_keys`), Private Key als **Environment-Secret**. Die Ansible-Rolle `deploy_key` (Keypair auf der Infra-Box erzeugen, per Cross-Host-Fact auf prod autorisieren) entfällt komplett.
- **Host-Key-Pinning bleibt** (ADR-0010 hat TOFU explizit verworfen): prods `ssh_host_ed25519_key.pub` liegt als Actions-**Variable** (kein Secret — Host-Keys sind per Design öffentlich), der Job rendert daraus `known_hosts` und fährt mit `StrictHostKeyChecking=yes`.
- **SSH bleibt weltoffen** auf Port 22 (key-only, `fail2ban`, `PermitRootLogin no`) — wie schon vor der Migration. Eine IP-Allowlist ist gegen ephemere Runner-IPs nicht sinnvoll führbar.

### Infrastruktur: eine Box, Ansible schrumpft
Die `infra`-Gruppe verschwindet aus dem Inventory; die Rollen `registry`, `deploy_key`, `infra_compose` (samt dind- und Deploy-Image-Buildkontexten) werden gelöscht. Prods `insecure_registries` wird leer, `IMAGE_REGISTRY` in der gerenderten `.env` wird `ghcr.io/chesstopia`. Das Hetzner-Privatnetz hat keinen zweiten Teilnehmer mehr und kann abgebaut werden.

**Unverändert gültig aus ADR-0010:** die drei Compose-Stacks nach Eigentümergrenze (`db` + `edge` = Ansible, `app` = Pipeline), das externe Netz `chesstopia`, Caddy als Same-Origin-TLS-Terminierer, Image-Tags **nur** als Git-Short-Hash (kein wanderndes `latest`), das dedizierte `prod`-Spring-Profil, Ansible rein lokal vom Laptop.

### Prozess
Ticket-Workflow (`CHESS-N`) bleibt bei Jira, angebunden über Atlassians „GitHub for Jira"-App. `main` ist geschützt: PR-Pflicht, grüne Checks (engine/backend/frontend) und **mindestens ein Approval** — tragfähig, weil das Repo mehr als einen Committer hat.

## Consequences
- **„Public" ist eine tragende Wand, keine Einstellung.** Auf dem Free-Plan (auch *Free for Organizations*) sind Protected Branches, Required Reviewers, Environments **und Environment-Secrets** ausschließlich in **public** Repos enthalten — in privaten Repos erfordern sie GitHub Team. Ein späterer Wechsel auf private würde also nicht nur Minuten und Runner-Größe kosten, sondern **den Deploy-Workflow sofort brechen** (der SSH-Key hängt am Environment `production`) und den Branch-Schutz auf `main` abschalten. Wer das Repo privat stellen will, muss gleichzeitig Team buchen.
- **Betriebskosten und Wartungslast sinken deutlich:** eine VPS weniger, kein Runner-Agent, keine Registry, keine `insecure-registries`, kein Docker-Socket-Mount (der auf der Infra-Box root-äquivalent war). Der in ADR-0010 akzeptierte „Self-hosted = Wartungslast"-Posten entfällt.
- **Der Lerneffekt eigener Infrastruktur — in ADR-0010 ausdrücklich als Grund für die Infra-Box genannt — wird aufgegeben.** Das ist der eigentliche Preis dieser Migration, nicht ein technischer.
- **Prod bekommt die CPU nicht zurück:** die in ADR-0010 beklagte invertierte CPU-Allokation (Build 4 Kerne, latenzkritisches Stockfish nur 2) bleibt bestehen — die Prod-Box bleibt bei 4 GB / 2 CPU. Der Build wandert nur woanders hin.
- **Neue Abhängigkeit von GitHub als Single Point of Failure:** Repo, CI, Registry und Deploy-Trigger liegen jetzt bei einem Anbieter. Bei GHCR-Ausfall kann prod keine neuen Images ziehen (laufende Container bleiben unberührt).
- **Der Deploy-Key liegt bei einem Cloud-Anbieter** statt auf eigener Hardware, und `deploy` ist Mitglied der `docker`-Gruppe — auf dieser Box root-äquivalent. Kompromittiertes Environment-Secret = kompromittierte Prod-Box. Konsequenz: **Write-Access aufs Repo ist ein Prod-Zugang** und muss so behandelt werden.
- **Quellcode, Prod-IP, Admin-Pubkeys und die Infrastruktur-Topologie sind öffentlich.** Kein Secret-Leak (Vault ist verschlüsselt), aber die Angriffsfläche ist jetzt beschrieben statt verborgen. Security-by-obscurity war ohnehin nie der Schutz — die Härtung (key-only, fail2ban, UFW deny-in, kein Postgres-Port nach außen) trägt das.
- **Redundanter Engine-Build in drei Jobs.** Sichtbar in der Job-Laufzeit, ökonomisch irrelevant. Sollte der Engine-Build stark wachsen, ist die Cache-Warmup-Kette aus ADR-0009 der dokumentierte Rückweg.
- **GHCR sammelt Images ohne Auto-GC.** Bei public Packages kostenlos, aber die Liste wächst pro `main`-Merge um zwei Einträge. Aufräumen später per Retention-Action.
- **Das Backup-Loch ist jetzt offen und bewusst offen:** ADR-0010 plante `pg_dump` + rsync auf die Infra-Box (nie verdrahtet). Die Box gibt es nicht mehr, ein Ersatzziel ist nicht bestimmt — die Prod-Datenbank hängt an genau einer Platte. **Offene Schuld**, vertretbar nur solange keine echten Nutzerdaten in der DB liegen. Kandidat: Hetzner Storage Box + restic.

## Verworfene Alternativen
- **Privates Repo behalten.** Hätte den Code geschützt, aber jede einzelne technische Zusage kassiert: 2.000 statt unbegrenzte Minuten, 7-GB- statt 16-GB-Runner (das 8-GB-Build-Problem wäre zurück), 500 MB GHCR-Storage (nach wenigen Commits erschöpft — die Packages hätten trotzdem public sein müssen) und ein Deploy-Gate nur gegen Aufpreis (Environment-Schutzregeln erfordern Pro/Team). Verworfen: der Free-Tier-Wunsch und der Private-Wunsch sind bei GitHub schlicht unvereinbar.
- **`registry:2` auf der Prod-Box installieren.** Die Registry hinge dann am öffentlichen Netz statt am Privatnetz und bräuchte zwingend TLS (Caddy) **und** Auth (htpasswd), dazu Plattenplatz und Garbage Collection auf der knappen 4-GB-Box. Mehr bewegliche Teile als GHCR, bei null Gegenwert.
- **Ganz ohne Registry (`docker save` | `ssh prod docker load`).** Keine Registry-Abhängigkeit, aber ~300 MB pro Deploy über SSH und der Verlust des billigen Rollbacks: ohne Image-Archiv gibt es kein „zieh nochmal den Hash von letzter Woche".
- **Pull-basiertes Deployment (Watchtower o. ä. auf prod).** Bräuchte kein SSH und kein Secret bei GitHub — hört aber auf einen wandernden Tag und bricht damit das Hash-Pinning und das deterministische Rollback aus ADR-0010. Das manuelle Gate müsste neu erfunden werden.
- **Tailscale/WireGuard zwischen Runner und prod.** Schließt Port 22 gegen die Welt, schützt aber nicht gegen das eigentliche Risiko (kompromittierter Auth-Key im Secret-Store) und bringt eine externe Abhängigkeit plus Ansible-Rolle mit.
- **Hetzner Cloud Firewall dynamisch pro Deploy öffnen.** Port wäre 99 % der Zeit zu, kostet aber ein API-Token mit Firewall-Schreibrechten als weiteres Secret und das Risiko, sich selbst auszusperren.
- **Cache-Warmup-Kette aus ADR-0009 1:1 portieren.** Weniger redundante CPU-Arbeit, aber längere Wall-Clock und eine Cache-Key-Mechanik zwischen Jobs, deren Fehlschlag nur als „irgendwie langsam" auffällt. Verworfen, weil ihr ökonomischer Grund (bezahlte Minuten) entfallen ist.
- **Ein einziger Build-Job (`./gradlew buildAll`).** Kürzeste Laufzeit, aber im UI nur noch „grün/rot" statt der Information, *welche* Komponente kaputt ist — genau das, was ADR-0009 verworfen hat und was weiterhin gilt.
- **Deploy als genehmigungspflichtiger Job in der CI-Kette** (statt eigener Workflow). Näher an Bitbucketts `trigger: manual`, aber Rollback nur über „Re-run" eines alten Runs und kein Redeploy ohne Rebuild. Bei identischem Klick-Aufwand ist `workflow_dispatch` strikt mächtiger.
- **Vault-Dateien aus dem Repo nehmen / auf SOPS+age umstellen.** Beides sicherer im Prinzip; ersteres macht das Provisioning von einem frischen Laptop unmöglich (Konfiguration nicht mehr vollständig im Repo), letzteres ist für drei Secrets viel Zeremonie. Die 30-Zeichen-Passphrase trägt.

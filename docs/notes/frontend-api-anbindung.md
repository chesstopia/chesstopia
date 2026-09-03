---
type: note
status: current
updated: 2026-09-03
verifies:
  - "chesstopia-frontend/src/lib/api.ts :: basePath: ''"
  - 'chesstopia-frontend/vite.config.ts :: "/api": "http://localhost:8080"'
  - 'docs/api/openapi.yaml :: url: http://localhost:8080'
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/config/SecurityConfig.java :: http://localhost:5173'
  - 'infra/roles/edge/templates/Caddyfile :: header_up -Origin'
---

# Frontend-Anbindung an die API

Wie das React-Frontend den generierten `@chesstopia/openapi-client` aufruft. Das *Warum* der Codegen-Kette steht in [ADR-0008](../adr/0008-openapi-first-codegen.md), das *Warum* der Same-Origin-Topologie in [ADR-0010](../adr/0010-deployment-cicd-infrastruktur.md).

## Der `basePath` muss leer sein

Der `typescript-axios`-Generator backt `servers[0].url` aus `openapi.yaml` als absoluten `BASE_PATH` in `openapi-client/src/base.ts`. Diese URL beschreibt das **lokale Backend** (`http://localhost:8080`) — sie ins Prod-Bundle zu übernehmen macht jeden Request unerreichbar (falsche Origin, zusätzlich Mixed-Content unter HTTPS).

Deshalb wird der Client **nie ohne Konfiguration** instanziiert:

```ts
// src/lib/api.ts — eine Instanz, überall wiederverwendet
export const apiConfig = new Configuration({ basePath: '' });

// im Hook / Service
const gameApi = new GameApi(apiConfig);
```

`basePath: ''` erzwingt relative Requests (`/api/v1/…`) gegen dieselbe Origin, unter der das Frontend ausgeliefert wird. Das Frontend-Image bleibt damit hostname-frei — die Domain ist eine reine Ansible-Änderung (`SITE_HOSTNAME`), kein Neubau.

Ein Versuch, das über einen relativen `servers`-Eintrag (`url: /`) zu lösen, scheitert: der Generator löst relative Server gegen `http://localhost` auf und schreibt wieder einen absoluten `BASE_PATH`.

## Routing des `/api`-Präfixes

| Umgebung | Wer routet `/api/*` ans Backend |
|---|---|
| Prod | Caddy (edge-Stack), `handle /api/*` → `reverse_proxy backend:8080` — Präfix bleibt dran ([ADR-0010](../adr/0010-deployment-cicd-infrastruktur.md)) |
| Dev | `server.proxy` in `vite.config.ts`: `"/api" -> http://localhost:8080` |

## CORS: die Backend-Allowlist bleibt, Caddy strippt den Origin-Header

Beide Umgebungen laufen same-origin — trotzdem ist die CORS-Konfiguration im Backend (`SecurityConfig`, `allowedOrigins` = nur `http://localhost:5173`) **nicht** überflüssig, und sie darf nicht entfernt werden:

- Browser hängen bei jedem **Nicht-GET**-Request einen `Origin`-Header an, auch same-origin. Spring Framework 7 (`DefaultCorsProcessor`) hat den früheren „same-origin durchlassen"-Kurzschluss nicht mehr: jeder Request mit `Origin`-Header auf einem Pfad mit registrierter `CorsConfiguration` (`/api/**`) wird gegen die Allowlist geprüft.
- **Dev** schickt `Origin: http://localhost:5173` (der Vite-Proxy reicht ihn unverändert weiter) — steht in der Allowlist, also passiert nichts. Dev *braucht* diesen Eintrag.
- **Prod** schickt `Origin: https://<SITE_HOSTNAME>` — steht nicht drin → 403, der Request erreicht den Controller nie. Erstmals sichtbar, als CHESS-13 die ersten schreibenden Calls (`POST /api/v1/games`, `POST …/moves`) vom klickbaren Brett brachte; das reine `GET /api/v1/board` davor trug keinen `Origin`-Header.

Gelöst an der Edge: der Caddyfile entfernt den `Origin`-Header auf `/api/*` (`header_up -Origin`), bevor er ans Backend proxyt. Damit ist der Request für das Backend kein CORS-Request mehr und läuft durch. Zulässig, weil Prod echt same-origin ist (eine Origin für SPA und `/api/*`); bei einem künftigen Split auf getrennte Origins (`app.` / `api.`) muss der Strip zurück und echtes CORS ins Backend.

Der Caddyfile ist Ansible-verwaltet (`infra/roles/edge/`) und wird **nicht** von der Deploy-Pipeline ausgerollt — die Änderung braucht einen `site.yml`-Lauf der edge-Rolle.

## Tests

Wer `@chesstopia/openapi-client` in einem Vitest-`vi.mock` ersetzt, muss `Configuration` mitmocken — `src/lib/api.ts` importiert es beim Modulladen (`useBoardState.test.ts` zeigt das Muster).

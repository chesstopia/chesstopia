---
type: note
status: current
updated: 2026-09-01
verifies:
  - "chesstopia-frontend/src/lib/api.ts :: basePath: ''"
  - 'chesstopia-frontend/vite.config.ts :: "/api": "http://localhost:8080"'
  - 'docs/api/openapi.yaml :: url: http://localhost:8080'
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
| Prod | Caddy (edge-Stack), `handle /api/* { reverse_proxy backend:8080 }` — Präfix bleibt dran ([ADR-0010](../adr/0010-deployment-cicd-infrastruktur.md)) |
| Dev | `server.proxy` in `vite.config.ts`: `"/api" -> http://localhost:8080` |

Weil Dev damit ebenfalls same-origin läuft, ist die CORS-Konfiguration im Backend (`SecurityConfig`, `allowedOrigins http://localhost:5173`) faktisch ungenutzt und kann bei einem Aufräumen entfallen.

## Tests

Wer `@chesstopia/openapi-client` in einem Vitest-`vi.mock` ersetzt, muss `Configuration` mitmocken — `src/lib/api.ts` importiert es beim Modulladen (`useBoardState.test.ts` zeigt das Muster).

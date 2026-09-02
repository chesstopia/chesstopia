import { Configuration } from '@chesstopia/openapi-client';

/**
 * Zentrale Client-Konfiguration.
 *
 * `basePath: ''` erzwingt relative, same-origin Requests (`/api/v1/…`). Der
 * generierte typescript-axios-Client würde sonst den aus `openapi.yaml` gebackenen
 * absoluten `BASE_PATH` (http://localhost…) verwenden — im Prod-Bundle fest
 * verdrahtet und damit unerreichbar.
 *
 * Routing des `/api`-Präfixes: in Prod terminiert Caddy TLS und leitet
 * `/api/*` an `backend:8080` weiter (ADR-0010); im Dev übernimmt das der
 * `server.proxy`-Eintrag in `vite.config.ts`.
 */
export const apiConfig = new Configuration({ basePath: '' });

import { defineConfig, devices } from '@playwright/test';

/**
 * Ebene 4 aus ADR-0019 — der Durchstich durch alle Module.
 *
 * Diese Konfiguration startet nichts. Seit ADR-0028 ist Ebene 4 ein
 * Black-Box-Client: Der Stack kommt von aussen, lokal wie in CI aus
 * `docker compose -f docker-compose.prod.yml -f docker-compose.e2e.yml up -d`,
 * beim Deploy-Smoke aus der bereits laufenden Produktion. Geprueft wird damit
 * immer der Prod-Stack — nginx hinter Caddy, `prod`-Profil —, nicht mehr ein
 * Boot-Jar neben einem Vite-Preview.
 *
 * Siehe docs/notes/e2e-aufbau.md.
 */

/**
 * Teilt sich der Lauf die Umgebung mit jemandem? Nur dann darf er nicht
 * parallelisieren. Frueher haeng dieses Kriterium an PLAYWRIGHT_BASE_URL — das
 * war gleichbedeutend, solange eine gesetzte Basis-URL immer Produktion meinte.
 * Seit der Wegwerf-Stack in CI ebenfalls ueber eine Basis-URL angesprochen wird,
 * waere E2E dort still seriell geworden.
 */
const sharedEnv = process.env.PLAYWRIGHT_SHARED_ENV === '1';

// Der veroeffentlichte Caddy-Port aus docker-compose.e2e.yml.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: !sharedEnv,
  workers: sharedEnv ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // Die Pruefmechanik des Korpus — Brettleser, Parser, Driftwaechter. Kein
    // Browser und kein Stack: diese Tests benutzen die `page`-Fixture nicht.
    // Eigenes Projekt statt Vitest, weil das weder eine Abhaengigkeit noch eine
    // zweite Konfiguration noch einen zusaetzlichen CI-Schritt kostet.
    { name: 'mechanik', testDir: './corpus/__tests__' },
  ],
});

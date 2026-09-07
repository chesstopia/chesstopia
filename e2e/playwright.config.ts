import { defineConfig, devices } from '@playwright/test';

/**
 * Ebene 4 aus ADR-0019 — der Durchstich durch alle Module.
 *
 * Gegen eine entfernte URL (PLAYWRIGHT_BASE_URL, siehe deploy.yml) startet
 * kein eigener Stack — Backend und Frontend laufen dort bereits. Lokal und
 * in CI baut Playwright den Stack selbst über zwei webServer-Einträge:
 * das Backend-Jar (Artefaktname und Pfad identisch zu ci.yml) und der
 * Vite-Preview-Server — nicht `vite dev`, geprüft wird das gebaute Bundle,
 * also das, was ins Docker-Image geht.
 *
 * Postgres startet hier NICHT mit — lokal per `docker compose up -d
 * postgres`, in CI per Service-Container (siehe .github/workflows/ci.yml).
 * Siehe docs/notes/e2e-aufbau.md.
 */
const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = remoteBaseURL ?? 'http://localhost:4173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: !remoteBaseURL,
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
  ],
  webServer: remoteBaseURL
    ? undefined
    : [
        {
          command: 'java -jar chesstopia-backend/build/libs/app.jar',
          url: 'http://localhost:8080/actuator/health',
          cwd: '..',
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
        {
          // Kein `--` vor den Flags: pnpm reicht es wörtlich weiter, Vites CLI
          // wertet alles danach als Positionsargument und ignoriert --port und
          // --strictPort stillschweigend. Gemessen: mit `--` startet der Server
          // auf dem nächsten freien Port statt zu scheitern.
          command: 'pnpm --filter chesstopia-frontend run preview --port 4173 --strictPort',
          url: 'http://localhost:4173',
          cwd: '..',
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
      ],
});

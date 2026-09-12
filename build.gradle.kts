import com.github.gradle.node.pnpm.task.PnpmInstallTask
import com.github.gradle.node.pnpm.task.PnpmTask

plugins {
    alias(libs.plugins.node.gradle)
}

// Documentation consistency checks — deliberately not wired into `check`,
// see the header of the script for why.
apply(from = "gradle/check-docs.gradle.kts")

node {
    // Node.js version managed by the plugin — no manual install required
    version = "22.14.0"
    pnpmVersion = "9.15.9"
    download = true
    workDir = file("${rootDir}/.gradle/nodejs")
    // pnpmInstall runs in the project directory (root) by default,
    // which is where pnpm-workspace.yaml lives — no extra config needed
}

// Ensure the chess-engine JS library is built before pnpm links the workspace package
tasks.named<PnpmInstallTask>("pnpmInstall") {
    dependsOn(gradle.includedBuild("chess-engine").task(":jsBrowserProductionLibraryDistribution"))
}

// Vite production build for the React frontend
tasks.register<PnpmTask>("pnpmFrontendBuild") {
    dependsOn("pnpmInstall")
    args.set(listOf("--filter", "chesstopia-frontend", "build"))
    inputs.dir("chesstopia-frontend/src")
    inputs.file("chesstopia-frontend/index.html")
    inputs.file("chesstopia-frontend/package.json")
    outputs.dir("chesstopia-frontend/dist")
}

// ESLint check for the React frontend (CI gate)
tasks.register<PnpmTask>("pnpmFrontendLint") {
    dependsOn("pnpmInstall")
    args.set(listOf("--filter", "chesstopia-frontend", "lint"))
}

// Vitest unit tests for the React frontend (CI gate)
tasks.register<PnpmTask>("pnpmFrontendTest") {
    dependsOn("pnpmInstall")
    args.set(listOf("--filter", "chesstopia-frontend", "test"))
}

// Playwright-Browser holen. Eigener Task statt eines blanken `pnpm`-Aufrufs im
// Workflow: Node und pnpm liegen unter .gradle/, nicht auf dem PATH des Runners.
// Bewusst NICHT in pnpmE2eTest verdrahtet — `--with-deps` ruft `sudo apt-get`
// und hätte lokal bei jedem Testlauf eine Passwortabfrage.
tasks.register<PnpmTask>("playwrightInstallBrowsers") {
    dependsOn("pnpmInstall")
    args.set(listOf("--filter", "e2e", "exec", "playwright", "install", "--with-deps", "chromium"))
}

// Playwright E2E-Tests für Ebene 4 (ADR-0019). Bewusst NICHT in buildAll —
// Ebene 3 und 4 laufen nicht bei jedem Speichern, sondern in CI und vor dem Merge.
// Playwright startet den Stack selbst über die webServer-Einträge in
// e2e/playwright.config.ts; die beiden Artefakte müssen dafür vorliegen:
//   bootJar             → chesstopia-backend/build/libs/app.jar
//   pnpmFrontendBuild   → chesstopia-frontend/dist
// bootJar statt build: die Backend-Tests laufen bereits im eigenen CI-Job, ein
// zweiter Zonky-Durchlauf hier kostet nur Zeit.
// generateOpenApiClient ist Pflicht, nicht Kosmetik: pnpmFrontendBuild hängt
// nicht daran, und auf einem frischen Checkout ist openapi-client/src leer
// (gitignored) — `tsc -b` bricht dann ab.
// Nur chromium: playwrightInstallBrowsers holt auch nur den. Firefox und WebKit
// sind in playwright.config.ts konfiguriert und lokal per direktem
// `playwright test --project=firefox` erreichbar, laufen aber nicht in CI.
// Das zweite Projekt `mechanik` ist browserlos — es prüft die Korpus-Mechanik
// selbst und braucht deshalb keine Browserinstallation.
// Eine Datenbank startet dieser Task nicht — lokal `docker compose up -d postgres`,
// in CI der Service-Container im e2e-Job.
tasks.register<PnpmTask>("pnpmE2eTest") {
    dependsOn("generateOpenApiClient", ":chesstopia-backend:bootJar", "pnpmFrontendBuild")
    // `exec` statt `test`: bei der Skript-Kurzform beansprucht pnpm --project
    // für sich und bricht mit "Unknown option: 'project'" ab.
    //
    // Zwei Projekte: `chromium` fährt die Specs und den Korpus im Browser,
    // `mechanik` prüft den Korpus-Läufer selbst (Parser, Brettleser,
    // Driftwächter). Ohne den zweiten Eintrag liefe die Prüfmechanik in CI
    // nicht mit — eine Mechanik, die nie rot war, prüft nichts.
    args.set(
        listOf(
            "--filter", "e2e", "exec", "playwright", "test",
            "--project=chromium", "--project=mechanik",
        ),
    )
}

// Der Smoke aus ADR-0019 gegen eine bereits laufende Umgebung. Ohne
// bootJar/pnpmFrontendBuild-Abhängigkeit: PLAYWRIGHT_BASE_URL schaltet in
// e2e/playwright.config.ts die webServer-Einträge ab, es wird nichts lokal
// gestartet und deshalb auch nichts lokal gebaut.
// Nebenwirkung, bewusst in Kauf genommen: der Lauf legt in der Zielumgebung
// eine Partie an und spielt einen Zug — nach jedem Deploy eine Zeile mehr in
// `partie` und `zug`. Anonyme Partien ohne Aufräumendpunkt; wer das nicht will,
// braucht einen Löschpfad, nicht einen schwächeren Smoke.
tasks.register<PnpmTask>("playwrightSmoke") {
    dependsOn("pnpmInstall")
    args.set(
        listOf(
            "--filter", "e2e", "exec", "playwright", "test", "smoke.spec.ts", "--project=chromium",
        ),
    )
}

// Generate the TypeScript Axios client from docs/api/openapi.yaml
tasks.register<PnpmTask>("generateOpenApiClient") {
    group = "openapi"
    description = "Generates TypeScript Axios client from docs/api/openapi.yaml"
    args.set(listOf("--filter", "@chesstopia/openapi-client", "run", "generate"))
    dependsOn("pnpmInstall")
    inputs.file("docs/api/openapi.yaml")
    outputs.dir("openapi-client/src")
}

/**
 * Full monorepo build:
 *   1. chess-engine → JVM jar (consumed by Spring Boot via composite build)
 *   2. chess-engine → JS library + .d.ts (consumed by React via pnpm workspace)
 *   3. pnpm install → links workspace packages in node_modules
 *   4. openapi-client → TypeScript Axios client (from docs/api/openapi.yaml)
 *   5. chesstopia-backend → Spring Boot jar (incl. generated Spring interfaces)
 *   6. Vite → React frontend bundle (chesstopia-frontend/dist/)
 *
 * Usage: ./gradlew buildAll
 */
tasks.register("buildAll") {
    group = "build"
    description = "Builds chess-engine (JVM + JS), generates OpenAPI clients, builds Spring Boot backend and React frontend"
    dependsOn(
        gradle.includedBuild("chess-engine").task(":build"),
        "generateOpenApiClient",
        ":chesstopia-backend:build",
        "pnpmFrontendBuild"
    )
}

/**
 * Baut und testet die chess-engine allein (JVM-Jar + JS-Library, inkl. Tests).
 * Dies ist die EINZIGE Stelle, an der die Testsuite der Engine läuft — der
 * Backend-Build konsumiert nur ihre Jar-Task, der Frontend-Build nur ihre
 * JS-Distribution. Beide bauen die Engine transitiv und gleichzeitig mit
 * (Composite Build bzw. pnpmInstall-Kette, ADR-0006); dieser Task baut sie
 * NICHT für sie vor. chess-engine hat keinen eigenen Wrapper und wird deshalb
 * über den Composite Build angesteuert.
 */
tasks.register("chessEngineBuild") {
    group = "build"
    description = "Baut und testet die chess-engine (JVM + JS) — die einzige Stelle, an der ihre Testsuite läuft"
    dependsOn(gradle.includedBuild("chess-engine").task(":build"))
}

# ADR-0009: CI-Pipeline — Build- & Test-Health-Check (Bitbucket)

## Status
Accepted

## Context
Das Monorepo braucht eine erste CI-Pipeline, die ausschließlich prüft, dass **Builds und Tests gesund sind** — Build-Artefakte werden (noch) nicht weiterverarbeitet (kein Deploy, kein Publish). Mehrere harte Rahmenbedingungen aus dem bestehenden Code prägen das Design:

1. **Composite Build (ADR-0006):** `backend` zieht `chess-engine` über `includeBuild` *aus dem Quellcode*; `pnpmInstall` hängt an `jsBrowserProductionLibraryDistribution`. Ein vorgebautes jar/dist lässt sich nicht einfach unterschieben — jeder Step, der backend oder frontend baut, baut chess-engine transitiv mit.
2. **Bitbucket-Steps sind isolierte Container** ohne gemeinsames Dateisystem, und Build-Minuten werden pro Step abgerechnet (Free Tier: 50 min/Monat).
3. **JDK 25 ist Pflicht, Toolchain-Auto-Download ist deaktiviert** (`org.gradle.java.installations.auto-download=false`, weil foojay-resolver 0.9.0 mit Gradle 9.5.1 inkompatibel ist). Das CI-Image muss JDK 25 mitbringen.
4. **Backend-Tests nutzen embedded Postgres** (ADR-0008, `io.zonky`) — kein externer DB-Service nötig.
5. **Das Frontend hatte keinen Test-Runner.** Für diese Pipeline wurde Vitest eingeführt (`chesstopia-frontend`, `button.test.tsx`); der Frontend-Step prüft Lint + Test + Build (inkl. `tsc`-Typecheck).

## Decision

### Komponenten-Steps statt Build/Test-Trennung
Drei Steps entlang der **Komponenten** — `chess-engine`, `backend`, `frontend` — die jeweils bauen *und* testen. Eine Trennung in separate „Build"- und „Test"-Steps wurde verworfen: Gradles `build` enthält `test`/`check` bereits, eine Aufspaltung würde dieselbe Kompilierung doppelt ausführen.

### Reuse über Gradle Build Cache statt Artefakt-Passing
chess-engine wird *nicht* als Bitbucket-Artefakt (jar/dist) an backend/frontend übergeben. Echtes Artefakt-Passing würde erfordern, backend/frontend in CI vom Composite-Build bzw. von der pnpm-Task-Kette zu entkoppeln — das ließe **CI anders bauen als lokal** und widerspräche ADR-0006.

Stattdessen: `org.gradle.caching=true`. **Stage 1** baut+testet chess-engine (`chessEngineBuild`) und füllt den Gradle Build Cache; **Stage 2** (parallel `backend` + `frontend`) erhält **Cache-Hits** auf dieselben chess-engine-Tasks. Composite Build bleibt unangetastet, lokal == CI. Da parallele Steps sich gegenseitig nicht sehen, muss chess-engine *vorgelagert* (sequenziell) laufen, damit der Cache vor Stage 2 hochgeladen ist.

### Ein Image, alles über `./gradlew`
Image **`eclipse-temurin:25-jdk`** für alle Steps (JDK 25 zwingend; Node.js + pnpm werden vom node-gradle-Plugin geladen → kein Node im Image). Alle Steps laufen über `./gradlew`. Dafür neu im Root-`build.gradle.kts`:
- `chessEngineBuild` — Aggregat-Task auf den Composite-Build (`chess-engine` hat kein eigenes `gradlew`).
- `pnpmFrontendLint` / `pnpmFrontendTest` — `PnpmTask`-Wrapper für die Frontend-Gates.

### Trigger
`pull-requests: '**'` (Health-Check vor jedem Merge) + `branches: main` (Absicherung nach Merge). Bewusst *kein* `default`, um Minuten auf WIP-Branch-Pushes zu sparen.

### Caching
File-keyed Caches für die volatilen Teile (robust gegen Dependency-Drift): `~/.gradle/caches` (keyed auf `libs.versions.toml`, `**/*.gradle.kts`, `gradle.properties`) und der pnpm-Store (keyed auf `pnpm-lock.yaml`). Named Caches für stabile Downloads: Gradle-Wrapper-Distribution, node-gradle Node/pnpm-Binaries. `org.gradle.daemon=false` (frischer Container → Daemon bringt nur Overhead).

## Consequences
- Eine grüne, günstige PR-gegatete Pipeline; klare Komponenten-Trennung im UI.
- chess-engine wird formal in mehreren Steps durch Gradle gefahren, aber Cache-gestützt (Task-Hits). Der Fixkostenblock pro Step (Gradle-/Kotlin-Startup, JDK-Bereitstellung) bleibt — das eliminiert auch Artefakt-Passing nicht.
- Kein DB-Service in der Pipeline (embedded Postgres).
- **Latente Abhängigkeit:** Sobald das Frontend `@chesstopia/openapi-client` tatsächlich importiert, muss `generateOpenApiClient` vor dem Frontend-Step laufen (aktuell nicht der Fall).
- Standard-Step hat 4 GB RAM. Bei OOM (Kotlin/JS + Spring-Tests) ist der Hebel `size: 2x` (8 GB, doppelte Minuten) oder perspektivisch eine sparsamere JVM (OpenJ9/Semeru).
- Mit Build-Artefakten passiert noch nichts (Deploy/Publish bewusst außerhalb des Scopes).
- **Verworfene Alternativen:** Ein einzelner Step (`buildAll`) — günstiger, aber keine Komponenten-Klarheit im UI. Artefakt-Passing — feinere Kontrolle, aber CI ≠ lokal und gegen ADR-0006.

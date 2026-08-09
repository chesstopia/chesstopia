---
type: adr
status: accepted
implementation: complete
updated: 2026-08-08
supersedes: []
verifies:
  - 'build.gradle.kts :: tasks.register("buildAll")'
  - 'pnpm-workspace.yaml :: verifyDepsBeforeRun: false'
---

# ADR-0006: Build-Orchestrierung — Gradle Composite Build + pnpm Workspaces + node-gradle Plugin

## Status
Accepted

## Context
Das Monorepo enthält ein KMP-Modul (`chess-engine`), das sowohl für JVM (Spring Boot) als auch für JS/TypeScript (React) gebaut werden muss. Beide Konsumenten müssen das Artefakt direkt aus dem Quellcode einbinden — ohne externen Publish-Schritt zu einem Registry.

Vier unabhängige Build-Systeme müssen koordiniert werden:
1. **Gradle** (KMP-Kompilierung: JVM-Jar + JS-Library-Distribution + `.d.ts`; Spring Boot Backend; OpenAPI-Stub-Generierung)
2. **openapi-generator-cli** (Java-JAR via Gradle-`JavaExec`: Spring-Interfaces + TypeScript Axios Client aus `docs/api/openapi.yaml`)
3. **pnpm** (npm Workspace Linking: `@chesstopia/chess-engine` + `@chesstopia/openapi-client` → React Frontend)
4. **Vite** (Frontend-Bundle: `chesstopia-frontend`)

## Decision

### JVM-Seite: Gradle Composite Build
`chess-engine` ist ein eigenständiges Gradle-Projekt mit eigener `settings.gradle.kts`. Das Monorepo-Root includet es via `includeBuild("chess-engine")`. Das Spring Boot Backend deklariert `implementation("io.chesstopia:chess-engine")`; Gradle substituiert automatisch mit dem lokalen Build — kein `publishToMavenLocal` nötig.

### JS-Seite: pnpm Workspaces
`chess-engine/package.json` deklariert das npm-Package `@chesstopia/chess-engine` und zeigt mit `main`/`types` auf das Gradle-Build-Output (`build/dist/js/productionLibrary/`). `pnpm-workspace.yaml` im Root registriert `chess-engine` und `chesstopia-frontend` als Workspace-Packages. `chesstopia-frontend/package.json` deklariert `"@chesstopia/chess-engine": "workspace:*"` in `dependencies` — pnpm löst diese Dependency immer lokal auf, kein Registry-Fallback. Nach `pnpm install` ist `@chesstopia/chess-engine` als lokaler Link im `node_modules` des Frontends verfügbar. Vite wird mit `optimizeDeps.include: ['@chesstopia/chess-engine']` konfiguriert, damit das CJS-Bundle zur Entwicklungszeit korrekt zu ESM pre-gebundelt wird.

### Orchestrierung: com.github.node-gradle.node Plugin
Das Root-`build.gradle.kts` wendet das `com.github.node-gradle.node`-Plugin an. Es verwaltet Node.js- und pnpm-Versionen (Download falls nötig) und stellt einen `pnpmInstall`-Task bereit. Dieser Task hängt von `chess-engine:jsBrowserProductionLibraryDistribution` ab — das JS-Artefakt ist garantiert vorhanden bevor pnpm linkt.

### OpenAPI Code Generation ([ADR-0008](0008-openapi-first-codegen.md))
`docs/api/openapi.yaml` ist die Single Source of Truth für die REST-API. Der `openApiGenerate`-Task (Gradle `JavaExec`, openapi-generator-cli 7.22.0) generiert Spring-Interfaces ins Backend-Build-Verzeichnis; `compileJava` hängt davon ab. Der `generateOpenApiClient`-Task (Root-`PnpmTask`) generiert den TypeScript Axios Client via `@openapitools/openapi-generator-cli` ins `openapi-client/src/`-Verzeichnis (gitignored). Das Workspace-Paket `@chesstopia/openapi-client` wird von `pnpm-workspace.yaml` registriert und ist im Frontend via `"workspace:*"` einbindbar. Details siehe [ADR-0008](0008-openapi-first-codegen.md).

Der zentrale Build-Befehl ist:
```
./gradlew buildAll
```
Dieser baut chess-engine (JVM + JS), generiert OpenAPI-Clients (Backend + Frontend), baut das Spring Boot Backend (inkl. generierter Stubs), führt `pnpm install` aus und triggert den Vite-Frontend-Build. Der `pnpmFrontendBuild`-Task deklariert explizite Gradle-Inputs (`chesstopia-frontend/src/`, `index.html`, `package.json`) und -Outputs (`chesstopia-frontend/dist/`), sodass Gradle den Task bei unveränderten Inputs überspringt.

`chesstopia-frontend` und `openapi-client` sind keine Gradle-Subprojekte — die Orchestrierung erfolgt ausschließlich über `PnpmTask`-Instanzen im Root-`build.gradle.kts`. Java (für `./gradlew`) ist die einzige Voraussetzung für den vollständigen Build; Node.js und pnpm werden vom Plugin verwaltet.

## Consequences
- Ein einziger Befehl (`./gradlew buildAll`) baut den gesamten Monorepo-Stand.
- Kein manueller `publishToMavenLocal`-, `npm link`- oder Generator-Aufruf.
- Gradle ist die Single Source of Truth für Build-Reihenfolge und Abhängigkeiten.
- Das node-gradle Plugin lädt Node.js und pnpm herunter falls nicht vorhanden — Onboarding ohne Pre-Installationen möglich.
- Build-Komplexität: Gradle muss Node/pnpm kennen; neue Entwickler brauchen nur Java (für `gradlew`).
- Generierter Code (OpenAPI-Stubs, TypeScript-Client) ist nicht committet; die IDE zeigt Importfehler bis der erste Build läuft.
- Alternative wäre ein Makefile oder Shell-Script gewesen — dieser Ansatz ist aber IDE-integrierbar und hat explizite Up-to-date-Checks.

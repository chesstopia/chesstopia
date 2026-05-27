# ADR-0006: Build-Orchestrierung — Gradle Composite Build + pnpm Workspaces + node-gradle Plugin

## Status
Accepted

## Context
Das Monorepo enthält ein KMP-Modul (`chess-engine`), das sowohl für JVM (Spring Boot) als auch für JS/TypeScript (React) gebaut werden muss. Beide Konsumenten müssen das Artefakt direkt aus dem Quellcode einbinden — ohne externen Publish-Schritt zu einem Registry.

Drei unabhängige Build-Systeme müssen koordiniert werden:
1. **Gradle** (KMP-Kompilierung: JVM-Jar + JS-Library-Distribution + `.d.ts`)
2. **pnpm** (npm Workspace Linking: `@chesstopia/chess-engine` → React Frontend)
3. (Später) **Vite** (Frontend-Bundle)

## Decision

### JVM-Seite: Gradle Composite Build
`chess-engine` ist ein eigenständiges Gradle-Projekt mit eigener `settings.gradle.kts`. Das Monorepo-Root includet es via `includeBuild("chess-engine")`. Das Spring Boot Backend deklariert `implementation("io.chesstopia:chess-engine")`; Gradle substituiert automatisch mit dem lokalen Build — kein `publishToMavenLocal` nötig.

### JS-Seite: pnpm Workspaces
`chess-engine/package.json` deklariert das npm-Package `@chesstopia/chess-engine` und zeigt mit `main`/`types` auf das Gradle-Build-Output (`build/dist/js/productionLibrary/`). `pnpm-workspace.yaml` im Root registriert `chess-engine` (und später `frontend`) als Workspace-Packages. Nach `pnpm install` ist `@chesstopia/chess-engine` als lokaler Link im `node_modules` des Frontends verfügbar.

### Orchestrierung: com.github.node-gradle.node Plugin
Das Root-`build.gradle.kts` wendet das `com.github.node-gradle.node`-Plugin an. Es verwaltet Node.js- und pnpm-Versionen (Download falls nötig) und stellt einen `pnpmInstall`-Task bereit. Dieser Task hängt von `chess-engine:jsBrowserProductionLibraryDistribution` ab — das JS-Artefakt ist garantiert vorhanden bevor pnpm linkt.

Der zentrale Build-Befehl ist:
```
./gradlew buildAll
```
Dieser baut chess-engine (JVM + JS) und führt `pnpm install` aus.

## Consequences
- Ein einziger Befehl (`./gradlew buildAll`) baut den gesamten Monorepo-Stand.
- Kein manueller `publishToMavenLocal`- oder `npm link`-Schritt.
- Gradle ist die Single Source of Truth für Build-Reihenfolge und Abhängigkeiten.
- Das node-gradle Plugin lädt Node.js und pnpm herunter falls nicht vorhanden — Onboarding ohne Pre-Installationen möglich.
- Build-Komplexität: Gradle muss Node/pnpm kennen; neue Entwickler brauchen nur Java (für `gradlew`).
- Alternative wäre ein Makefile oder Shell-Script gewesen — dieser Ansatz ist aber IDE-integrierbar und hat explizite Up-to-date-Checks.

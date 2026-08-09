---
type: adr
status: accepted
implementation: complete
updated: 2026-08-08
supersedes: []
verifies:
  - 'settings.gradle.kts :: includeBuild("chess-engine")'
---

# ADR-0001: Kotlin Multiplatform für die geteilte Schach-Validierungslogik

## Status
Accepted

## Context
Die Schach-Regelvalidierung (legale Züge, Schach/Matt/Patt-Erkennung, Sonderregeln wie En passant, Rochade, Promotion) ist komplex und muss sowohl im Backend (Spring Boot, JVM) als auch im Frontend (React, Browser) vorhanden sein. Das Backend ist die autoritäre Instanz; das Frontend braucht die Logik für sofortiges UX-Feedback (legale Züge hervorheben, Figuren bewegen ohne Server-Round-Trip).

Zwei Implementierungen (Java + TypeScript) würden bei Regeländerungen (z.B. neue Varianten, Toggles) immer synchron gehalten werden müssen — ein dauerhaftes Fehlerrisiko.

## Decision
Die Schach-Validierungslogik wird als eigenständiges **Kotlin Multiplatform**-Subprojekt (`chess-engine`) implementiert. Es kompiliert zu zwei Artefakten:
- **JVM-Jar**: eingebunden über einen **Gradle Composite Build** (`includeBuild("chess-engine")`) direkt als Source-Dependency in das Spring Boot Backend — kein lokales Maven-Publish nötig.
- **ES-Modul + TypeScript Declarations (Kotlin/JS IR)**: eingebunden als **pnpm Workspace Package** (`@chesstopia/chess-engine`) in das React/Vite Frontend. Alle öffentlichen API-Typen sind mit `@JsExport` annotiert; `.d.ts`-Dateien werden automatisch generiert.

Das Subprojekt lebt flach im Monorepo-Root (`chesstopia/chess-engine/`) und hat eine eigene `settings.gradle.kts` (standalone buildbar). Die Build-Orchestrierung ist in [ADR-0006](0006-build-orchestration.md) beschrieben.

Das Backend bleibt in Java; Kotlin wird ausschließlich für das `chess-engine`-Modul verwendet.

## Consequences
- Regellogik wird nur einmal implementiert und getestet — kein Divergenz-Risiko.
- Build-Komplexität steigt: Gradle muss beide Targets bauen bevor Frontend und Backend kompiliert werden können.
- Das Frontend-Bundle enthält das Kotlin/JS-Artefakt; Bundlegröße und Ladezeit müssen beobachtet werden.
- Neue Entwickler brauchen Grundkenntnisse in Kotlin für Beiträge zur Engine.
- Austausch der Engine-Implementierung ist möglich, solange die öffentliche API erhalten bleibt.

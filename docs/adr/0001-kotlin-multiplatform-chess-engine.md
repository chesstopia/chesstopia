# ADR-0001: Kotlin Multiplatform für die geteilte Schach-Validierungslogik

## Status
Accepted

## Context
Die Schach-Regelvalidierung (legale Züge, Schach/Matt/Patt-Erkennung, Sonderregeln wie En passant, Rochade, Promotion) ist komplex und muss sowohl im Backend (Spring Boot, JVM) als auch im Frontend (React, Browser) vorhanden sein. Das Backend ist die autoritäre Instanz; das Frontend braucht die Logik für sofortiges UX-Feedback (legale Züge hervorheben, Figuren bewegen ohne Server-Round-Trip).

Zwei Implementierungen (Java + TypeScript) würden bei Regeländerungen (z.B. neue Varianten, Toggles) immer synchron gehalten werden müssen — ein dauerhaftes Fehlerrisiko.

## Decision
Die Schach-Validierungslogik wird als eigenständiges **Kotlin Multiplatform**-Subprojekt (`chess-engine`) implementiert. Es kompiliert zu zwei Artefakten:
- **JVM-Jar**: eingebunden als Dependency in das Spring Boot Backend (Java).
- **ES-Modul (Kotlin/JS)**: eingebunden als lokale npm-Dependency in das React/Vite Frontend.

Das Subprojekt ist in das Gradle-Monorepo eingebunden. Das Backend bleibt in Java; Kotlin wird ausschließlich für das `chess-engine`-Modul verwendet.

## Consequences
- Regellogik wird nur einmal implementiert und getestet — kein Divergenz-Risiko.
- Build-Komplexität steigt: Gradle muss beide Targets bauen bevor Frontend und Backend kompiliert werden können.
- Das Frontend-Bundle enthält das Kotlin/JS-Artefakt; Bundlegröße und Ladezeit müssen beobachtet werden.
- Neue Entwickler brauchen Grundkenntnisse in Kotlin für Beiträge zur Engine.
- Austausch der Engine-Implementierung ist möglich, solange die öffentliche API erhalten bleibt.

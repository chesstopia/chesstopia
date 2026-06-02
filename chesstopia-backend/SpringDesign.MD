die antwort: SPRING BOOT INITIAL DECISION REPORT

Projekt: chesstopia-backend

---

1. Build System

Entscheidung: Gradle 8.x mit Kotlin DSL

Das Projekt ist bereits ein Gradle-Monorepo (chess-engine als KMP-Subprojekt, ADR-0001). Konsistenz im Build-System ist Pflicht. Gradle erlaubt präzise Kontrolle über Artefakt-Abhängigkeiten zwischen Subprojekten (chess-engine → backend). Die Kotlin DSL liefert Typ-Sicherheit und IDE-Unterstützung gegenüber Groovy. Maven würde eine zweite Build-Welt neben dem bestehenden Gradle-Setup erzeugen.

---

2. Language & Runtime

Entscheidung: Java 25 LTS. Kein Kotlin im Backend.

ADR-0001 ist explizit: "Das Backend bleibt in Java; Kotlin wird ausschließlich für das chess-engine-Modul verwendet." Java 25 ist die aktuelle LTS-Version. Virtual Threads (Project Loom) sind produktionsreif und direkt relevant für blockierende I/O-Operationen (Stockfish-Subprocess, LLM-API-Calls, WebSocket-Handling) ohne reaktive Programmierung. Java Records reduzieren Boilerplate für DTOs ohne zusätzliche Dependencies.

---

3. Spring Boot Version

Entscheidung: Spring Boot 4.0.6

Spring Boot 4.0.6 setzt Java 17+ voraus — mit Java 25 erfüllt. Spring Boot 3.2+ hat erstklassige Virtual Thread Unterstützung (spring.threads.virtual.enabled=true). 4.0.6 bringt eingebautes ProblemDetail (RFC 7807) und verbesserte Observability. Der 4.0.6-Zweig hat aktiven Support bis mindestens 2027. Keine 2.x — kein EOL-Risiko von Anfang an.

---

4. Project Structure Strategy

Entscheidung: Package-by-Feature mit internem Layering

Weder rein layered (controller/service/repository über alle Domains hinweg) noch vollständiges Hexagonal/Clean Architecture. Package-by-Feature gruppiert zusammengehörenden Code (game, user, rating etc.) und macht Domänengrenzen sichtbar. Innerhalb eines Features gibt es die klassische Schichtung. Hexagonal Architecture würde Ports/Adapters-Overhead für ein Team in der frühen Phase bedeuten — der Gewinn rechtfertigt den Aufwand nicht vor dem ersten Feature.

---

5. Packaging Strategy

Entscheidung: Single-Modul Spring Boot Backend

Das Backend startet als einzelnes Gradle-Subprojekt innerhalb des Monorepos. Interne Modularisierung (z.B. Aufspaltung in :game, :rating als eigene Gradle-Module) wird nicht vorbereitet. Multi-Module im Backend ist premature Optimization ohne bewiesenen Schnitt. Das chess-engine-Modul ist bereits separiert — das ist der einzig notwendige Modulschnitt dieser Phase.

---

6. Dependency Strategy

Entscheidung: Minimaler, erklärter Kern

Enthalten von Anfang an:

- spring-boot-starter-web — REST API
- spring-boot-starter-data-jpa — Persistenz
- spring-boot-starter-security — Security-Fundament (nicht ignorieren, siehe §11)
- spring-boot-starter-websocket — STOMP für Echtzeit-Spiel (core feature, kein Afterthought)
- spring-boot-starter-validation — Bean Validation
- spring-boot-starter-actuator — Observability
- postgresql Driver
- flyway-core — DB-Migrationen von Tag 1 (kein ddl-auto=create-drop)
- chess-engine (lokale Gradle-Dependency)

Explizit nicht enthalten:

- Lombok — Java 21 Records und moderne Sprachfeatures ersetzen es. Lombok erzeugt Build-Magie und Debugging-Overhead.
- MapStruct — Manuelles Mapping zu Beginn. Einführen wenn der Aufwand messbar wird.
- Spring Cloud — Monolith, kein Microservice-Setup.
- Redis / Spring Session — Kein Session-State in Phase 1 (JWT-basiert, stateless).
- Spring Batch — Async-Analyse läuft über @Async / eigenen ThreadPool, kein Batch-Framework nötig.

---

7. API Strategy

Entscheidung: REST, URL-Versionierung /api/v1/, kebab-case Pfade, camelCase JSON

URL-Präfix /api/v1/ von Anfang an — nachträgliches Einführen von Versionierung bricht Clients. Kebab-case für URL-Segmente (/game-invites, nicht /gameInvites) — HTTP-Konvention. JSON-Felder in camelCase — JavaScript-Frontend-Konvention; Jackson default. Content-Type-Verhandlung wird nicht implementiert — ausschließlich application/json. Keine HATEOAS — fügt Komplexität ohne Mehrwert für diesen Anwendungsfall hinzu.

---

8. Configuration Strategy

Entscheidung: application.yml, drei Profile (dev / test / prod), Secrets ausschließlich via Umgebungsvariablen

YAML statt Properties für Lesbarkeit bei tief verschachtelter Konfiguration (z.B. DataSource, Security, Stockfish-Pfad). Drei Profile: dev (H2 oder lokale PG, DevTools, SQL-Logging), test (Testcontainers oder Embedded DB), prod (keine Defaults, alle Werte explizit). application-prod.yml existiert nicht im Repository — alle Produktionswerte (DB-URL, JWT-Secret, API-Keys) kommen ausschließlich aus Umgebungsvariablen. Das verhindert Secret-Leaks im Git-History.

---

9. Observability

Entscheidung: SLF4J + Logback (Standard), strukturiertes Logging in prod, Actuator aktiviert, kein Tracing initial

SLF4J + Logback ist der Spring Boot Default — kein Austausch. In prod-Profil: JSON-Strukturlogs via logstash-logback-encoder (Vorbereitung für Log-Aggregation, ohne dass eine Infrastruktur existieren muss). In dev-Profil: menschenlesbarer Pattern-Output. Micrometer Metrics via Actuator sind von Anfang an aktiv — sie kosten nichts und liefern sofort nützliche JVM- und HTTP-Metriken. Distributed Tracing (Micrometer Tracing / Zipkin) wird nicht initial eingerichtet — kein Mehrwert ohne mehrere Services.

---

10. Error Handling Strategy

Entscheidung: Globaler @RestControllerAdvice von Tag 1, RFC 7807 ProblemDetail

Ein unkontrollierter Fehlerfall, der intern Stack Traces oder Spring-Internals an den Client leakt, ist inakzeptabel. Spring Boot 3.x hat ProblemDetail eingebaut — es wird direkt genutzt, kein eigenes Error-Envelope-Format. Der globale Handler unterscheidet zwischen Client-Fehlern (4xx, kein Logging) und Server-Fehlern (5xx, ERROR-Logging mit Trace-ID). Nachträgliches Hinzufügen eines globalen Handlers bedeutet, alle bisherigen Fehlerpfade zu auditieren — das ist teurer als es von Anfang an richtig zu machen.

---

11. Security Strategy

Entscheidung: Spring Security von Anfang an eingebunden, initial auf permit-all konfiguriert

Security komplett zu ignorieren und später als eigenes Feature hinzuzufügen ist ein Anti-Pattern. Jeder Endpoint, jede Datenstruktur, jeder Service-Aufruf muss später nachträglich auf Security geprüft werden. Stattdessen: spring-boot-starter-security ist von Tag 1 im Classpath. Initial wird eine explizite SecurityFilterChain-Bean konfiguriert, die alle Requests erlaubt — das ist ein bewusster, sichtbarer Zustand, kein vergessener. Die JWT-Filter-Struktur wird als leeres Skelett angelegt, damit der spätere Security-Schritt ein Ausfüllen ist, kein Umbau.

---

12. Development Strategy

Entscheidung: spring-boot-devtools im dev-Profil, kein Hot-Reload via JVM-Agenten

spring-boot-devtools mit Classpath-Watching und automatischem Neustart ist ausreichend für die frühe Entwicklungsphase. JRebel oder ähnliche Agenten sind lizenzpflichtig und überdimensioniert. spring-boot-devtools wird als developmentOnly-Dependency deklariert (Gradle-Scope), damit es nie in Produktions-Artefakten landet. Kein Lombok, kein Code-Generator — Änderungen an Entities sind bewusste, explizite Migrations + Neustart-Zyklen.

---

13. Monorepo Build Integration (ADR-0006)

Entscheidung: Gradle Composite Build — kein publishToMavenLocal

Das Backend-Subprojekt `chesstopia-backend` ist Teil eines Gradle-Monorepos. Das Monorepo-Root includet `chess-engine` via `includeBuild("chess-engine")` in der Root-`settings.gradle.kts`. Das Backend deklariert die Abhängigkeit als reguläre Maven-Koordinate:

    implementation("io.chesstopia:chess-engine")

Gradle substituiert sie zur Build-Zeit automatisch mit dem lokalen Composite-Build-Artefakt — kein manueller `publishToMavenLocal`-Schritt, kein Versions-Drift zwischen lokalem Stand und publiziertem Artefakt. Das Backend bekommt immer den aktuellen `chess-engine`-Stand aus dem Workspace.

Der kanonische Build-Einstiegspunkt für den gesamten Monorepo-Stand (JVM + JS) ist:

    ./gradlew buildAll

Für das Backend allein reicht:

    ./gradlew :chesstopia-backend:build

Gradle löst dabei die `chess-engine`-Abhängigkeit automatisch auf und baut sie (JVM-Jar) falls nötig. Die JS-Distribution und pnpm-Workspace-Schritte (für das React-Frontend) werden bei einem reinen Backend-Build nicht ausgeführt.

Konsequenzen für die Entwicklung: Kein separates Setup-Skript notwendig. Ein Entwickler mit Java/Gradle-Installation kann `./gradlew :chesstopia-backend:bootRun` ausführen und das Backend startet — die Engine wird on-the-fly kompiliert.

---

14. Chess-Engine API-Konventionen im Backend (ADR-0007)

Entscheidung: Engine-API nutzt Array statt List — Backend-Code muss das berücksichtigen

Die `chess-engine`-API trägt `@JsExport`-Annotationen direkt in `commonMain` (ADR-0007). Das hat eine konkrete Auswirkung auf JVM-Konsumenten: Exportierte Rückgabetypen wie `LegalMovesResult` verwenden `Array<Move>` statt `List<Move>`, weil `kotlin.collections.List` von `@JsExport` nicht unterstützt wird.

Im Backend bedeutet das:

- Rückgaben der Engine (z.B. `engine.legalMoves(position)`) liefern `Array<Move>`, keine `List<Move>`.
- Konvertierung zu `List` für JVM-idiomatische Weiterverarbeitung erfolgt explizit mit `.toList()` direkt nach dem Engine-Aufruf — nicht im Engine-Aufruf selbst.
- Service-Methoden, die Engine-Ergebnisse weiterreichen, operieren intern auf `List<Move>`; die Array-to-List-Konvertierung findet an der Engine-Grenze statt.
- DTOs und API-Responses verwenden Java/Kotlin-Collections — das `Array`-Format ist ein internes Implementierungsdetail der Engine-Integration und dringt nicht in die REST-Schicht.

Sollte die Engine-API in Zukunft eine `jsMain`-Fassade bekommen (z.B. für Promise-Wrapping), fällt diese Konvertierungsanforderung weg. Der Eingriffspunkt ist dann ausschließlich die Engine-Integration im Service-Layer — nicht das Backend-interne API-Design.

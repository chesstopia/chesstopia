---
type: note
status: current
updated: 2026-08-08
verifies:
  - 'chesstopia-backend/src/main/resources/application.yml :: virtual'
  - 'chesstopia-backend/src/main/resources/logback-spring.xml :: LogstashEncoder'
---

# Backend-Konventionen

Wie das Backend jenseits der Architekturentscheidungen eingerichtet ist. Die **Regeln** stehen kurz in [CLAUDE.md](../../CLAUDE.md); hier steht, warum sie so lauten und wie der heutige Aufbau tatsächlich aussieht.

Entschieden wurde anderswo: [ADR-0013](../adr/0013-package-by-feature-backend.md) (Schnitt), [ADR-0014](../adr/0014-minimaler-dependency-kern.md) (Abhängigkeiten), [ADR-0015](../adr/0015-security-von-tag-eins.md) (Security), [ADR-0012](../adr/0012-embedded-postgres-fuer-tests.md) (Testdatenbank).

## Laufzeit

Java-Toolchain und Spring-Boot-Version stehen in `chesstopia-backend/build.gradle.kts` und `gradle/libs.versions.toml`. Zwei Eigenschaften der Wahl sind aber inhaltlich relevant:

**Virtual Threads sind aktiv** (`spring.threads.virtual.enabled: true`). Das ist der Grund, warum blockierende Aufrufe hier vertretbar sind — Stockfish-Subprozess, LLM-Aufrufe, WebSocket-Handling. Es gibt deshalb keinen reaktiven Stack und keinen Bedarf dafür.

**Kein Kotlin im Backend** — das entschied bereits [ADR-0001](../adr/0001-kotlin-multiplatform-chess-engine.md). Records ersetzen DTO-Boilerplate.

## API-Oberfläche

Der Versionspräfix `/api/v1/` steht von Anfang an, weil nachträgliche Versionierung jeden bestehenden Client bricht. Kebab-case in Pfaden folgt der HTTP-Konvention, camelCase in JSON der des Frontends — und Jacksons Default.

Bewusst weggelassen: Content-Type-Verhandlung (ausschließlich `application/json`) und HATEOAS. Beide kosten Komplexität, die hier keinen Abnehmer hat.

Wo Pfade und Schemata definiert werden, steht in [modules/api-kontrakt.md](../modules/api-kontrakt.md) — nicht im Controller.

## Fehlerbehandlung

Ein globaler `@RestControllerAdvice` existiert seit dem ersten Commit, nicht weil früh Fehler auftraten, sondern weil das Nachrüsten bedeutet, sämtliche bereits existierenden Fehlerpfade zu auditieren. Das ist die teure Variante derselben Arbeit.

Das Format ist Spring-eigenes `ProblemDetail` (RFC 7807) — kein eigenes Error-Envelope. Die Trennung 4xx ohne Logging, 5xx mit ERROR-Log verhindert, dass fehlerhafte Clientaufrufe das Log fluten.

`server.error.include-message` und `include-stacktrace` stehen auf `never`. Interna verlassen den Prozess nicht.

## Konfiguration

Hier weicht der Ist-Zustand vom ursprünglichen Entwurf ab — der sah drei Profildateien vor:

| | vorhanden | Inhalt |
|---|---|---|
| `application.yml` | ja | Default-Profil: lokale PostgreSQL, SQL-Logging, DEBUG für `io.chesstopia` |
| `application-test.yml` | ja | `spring.test.database.replace: any`, `ddl-auto: validate` |
| `application-dev.yml` | **nein** | ein eigenes dev-Profil existiert nicht; das Default-Profil ist das Entwicklungsprofil |
| `application-prod.yml` | **nein, absichtlich** | Produktionswerte kommen ausschließlich aus Umgebungsvariablen |

`logback-spring.xml` kennt dagegen drei Profile — `prod`, `dev,default` und `test`. Die Profilnamen der Logging-Konfiguration und die vorhandenen Property-Dateien decken sich also nicht vollständig.

Die Zugangsdaten im Default-Profil sind lokale Entwicklungswerte für eine Datenbank auf `localhost`. Sie sind kein Secret — aber sie sind auch kein Muster: Für alles, was nicht `localhost` ist, gilt die Umgebungsvariable.

Schemaänderungen laufen über Flyway-Migrationen unter `src/main/resources/db/migration/`. Kein `ddl-auto`, das Tabellen erzeugt.

## Observability

SLF4J und Logback im Spring-Boot-Default, kein Austausch. Im `prod`-Profil schreibt der `LogstashEncoder` JSON-Strukturlogs — vorbereitet für eine Log-Aggregation, die es noch nicht gibt, aber ohne dass dafür Infrastruktur existieren muss. In `dev` und `test` menschenlesbarer Pattern-Output.

Actuator ist aktiv mit `health`, `info` und `metrics`. Micrometer-Metriken kosten nichts und liefern ab dem ersten Start JVM- und HTTP-Zahlen.

Distributed Tracing ist nicht eingerichtet. Es hat ohne mehrere Services keinen Abnehmer.

## Entwicklung

`spring-boot-devtools` ist als `developmentOnly` deklariert und landet damit nie im Produktionsartefakt. Classpath-Watching mit Neustart reicht für diese Phase; lizenzpflichtige JVM-Agenten wie JRebel sind überdimensioniert.

Änderungen an Entities sind bewusste Zyklen aus Migration und Neustart, kein Hot-Swap.

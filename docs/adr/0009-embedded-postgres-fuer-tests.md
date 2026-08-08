---
type: adr
status: accepted
implementation: complete
updated: 2026-08-08
supersedes: []
verifies:
  - 'gradle/libs.versions.toml :: io.zonky.test'
  - 'chesstopia-backend/build.gradle.kts :: libs.zonky.embedded.database.spring.test'
---

# ADR-0009: Zonky Embedded PostgreSQL für Tests statt H2 oder Testcontainers

## Status
Accepted

## Context

Tests laufen gegen echtes PostgreSQL-Verhalten. Die Wahl fiel auf Zonky `embedded-database-spring-test` statt Testcontainers, weil Testcontainers einen laufenden Docker-Daemon voraussetzt — was CI ohne Docker-in-Docker-Setup und lokale Entwicklung ohne laufenden Docker verkompliziert. Zonky startet einen vollständigen PostgreSQL-Prozess direkt (vorcompilierte Binaries), ohne externe Laufzeitabhängigkeit. H2 schied aus, weil selbst im PostgreSQL-Kompatibilitätsmodus Dialektunterschiede (z.B. spezifische Datentypen, Constraints, Sequenzen) zu Tests führen, die lokal grün sind, aber in Produktion scheitern.

## Considered Options

- **Testcontainers** — identische Postgres-Version wie Produktion, aber Docker-Daemon Pflicht; langsamer Start.
- **H2 im PostgreSQL-Modus** — kein externes Binary, aber unvollständige Kompatibilität (kein echter pg-Dialekt).
- **Zonky embedded-postgres** — echter PostgreSQL-Prozess, kein Docker-Daemon, schneller Start.

## Decision

Zonky `embedded-database-spring-test`.

## Consequences

- Ein Kontext-Test gegen die Datenbank braucht `@AutoConfigureEmbeddedDatabase`. **Ohne die Annotation läuft er gegen die konfigurierte echte Datenbank** — er schlägt dann nicht fehl, sondern arbeitet auf fremden Daten.
- Weder CI noch lokale Entwicklung brauchen einen Docker-Daemon.

<!--
Format-Angleichung 2026-08-08: Dieses ADR trug ursprünglich weder die
ADR-Nummer im Titel noch "## Status". Context und Considered Options sind
wörtlich unverändert übernommen; Status, Decision und Consequences wurden
ergänzt. Die Consequences sind aus dem Code belegt, nicht rekonstruiert.
-->


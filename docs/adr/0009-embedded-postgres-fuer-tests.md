# Zonky Embedded PostgreSQL für Tests statt H2 oder Testcontainers

Tests laufen gegen echtes PostgreSQL-Verhalten. Die Wahl fiel auf Zonky `embedded-database-spring-test` statt Testcontainers, weil Testcontainers einen laufenden Docker-Daemon voraussetzt — was CI ohne Docker-in-Docker-Setup und lokale Entwicklung ohne laufenden Docker verkompliziert. Zonky startet einen vollständigen PostgreSQL-Prozess direkt (vorcompilierte Binaries), ohne externe Laufzeitabhängigkeit. H2 schied aus, weil selbst im PostgreSQL-Kompatibilitätsmodus Dialektunterschiede (z.B. spezifische Datentypen, Constraints, Sequenzen) zu Tests führen, die lokal grün sind, aber in Produktion scheitern.

## Considered Options

- **Testcontainers** — identische Postgres-Version wie Produktion, aber Docker-Daemon Pflicht; langsamer Start.
- **H2 im PostgreSQL-Modus** — kein externes Binary, aber unvollständige Kompatibilität (kein echter pg-Dialekt).
- **Zonky embedded-postgres** — echter PostgreSQL-Prozess, kein Docker-Daemon, schneller Start.

---
type: adr
status: accepted
implementation: complete
updated: 2026-08-08
supersedes: []
verifies:
  - 'chesstopia-backend/build.gradle.kts :: spring-boot-starter-websocket'
---

# ADR-0014: Minimaler, erklärter Dependency-Kern — kein Lombok, kein MapStruct

## Status
Accepted

## Context

Ein frisches Spring-Boot-Projekt zieht erfahrungsgemäß Abhängigkeiten an, die nie begründet und nie wieder entfernt werden. Jede davon ist dauerhaft: Sie erscheint in Sicherheits-Scans, im Startup und in jeder Migration auf eine neue Spring-Generation.

Die Gegenbewegung — nur das Nötigste und alles später — hat den umgekehrten Fehler: Persistenz, Security und Echtzeitkommunikation nachträglich einzuziehen ist teurer als sie von Anfang an vorzusehen.

## Considered Options

- **Lombok** — spart Boilerplate, erzeugt aber Build-Magie und Debugging-Overhead. Records und moderne Sprachfeatures decken den Bedarf ab.
- **MapStruct** — lohnt sich erst, wenn Mapping-Aufwand messbar wird. Bis dahin von Hand.
- **Spring Cloud** — setzt ein Microservice-Setup voraus, das es hier nicht gibt.
- **Redis / Spring Session** — kein serverseitiger Session-State vorgesehen; die Authentifizierung ist stateless geplant.
- **Spring Batch** — asynchrone Analyse läuft über `@Async` und einen eigenen ThreadPool.

## Decision

Ein kleiner Kern, jede Abhängigkeit mit Begründung: Web, Data JPA, Security, WebSocket, Validation, Actuator, Flyway, der PostgreSQL-Treiber und `chess-engine`.

WebSocket und Security sind bewusst von Anfang an dabei, obwohl sie noch nichts tun — Echtzeit ist ein Kernfeature und kein Nachtrag, und für Security gilt [ADR-0015](0015-security-von-tag-eins.md).

Flyway ebenfalls ab Tag 1: kein `ddl-auto=create-drop`, kein Schema, das nur im Kopf der JPA-Entities existiert.

Lombok, MapStruct, Spring Cloud, Redis und Spring Batch werden nicht aufgenommen.

## Consequences

- Mapping zwischen Entity und DTO wird von Hand geschrieben. Wird das messbar teuer, ist das der Anlass, MapStruct erneut zu prüfen — nicht vorher.
- Kein Annotation-Processor im Build außer dem, was Spring selbst mitbringt. Ein Stacktrace zeigt Code, den man im Editor sehen kann.
- Die konkreten Versionen stehen in `gradle/libs.versions.toml` und `chesstopia-backend/build.gradle.kts` und nirgends sonst.
- Jede neue Abhängigkeit braucht eine Begründung. Diese Liste ist der Maßstab, gegen den sie zu rechtfertigen ist.

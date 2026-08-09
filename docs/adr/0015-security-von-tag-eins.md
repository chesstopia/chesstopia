---
type: adr
status: accepted
implementation: partial
updated: 2026-08-08
supersedes: []
verifies:
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/config/SecurityConfig.java :: anyRequest().permitAll()'
---

# ADR-0015: Spring Security von Tag 1, initial explizit auf permit-all

## Status
Accepted

## Context

Security später als eigenes Feature nachzurüsten heißt, jeden Endpunkt, jede Datenstruktur und jeden Service-Aufruf rückwirkend zu prüfen. Der Aufwand steigt mit jedem Feature, das in der Zwischenzeit entsteht.

Die Alternative — Security sofort scharf schalten — blockiert die Entwicklung, solange es weder Nutzerkonten noch ein Anmeldeverfahren gibt.

## Considered Options

- **`spring-boot-starter-security` weglassen und später hinzufügen** — verschiebt die Kosten und vervielfacht sie.
- **Starter im Classpath, keine eigene Konfiguration** — Spring Boot sichert dann alles per Default-Formular ab. Das ist ein unsichtbarer Zustand: Niemand hat ihn gewählt, und niemand liest ihn aus dem Code ab.
- **Sofort echte Authentifizierung** — es gibt noch keine Nutzerverwaltung, gegen die man authentifizieren könnte.

## Decision

`spring-boot-starter-security` ist von Tag 1 im Classpath, und es gibt eine explizite `SecurityFilterChain`-Bean, die alle Requests erlaubt.

Der Unterschied zur zweiten Option ist der ganze Punkt: **Der permissive Zustand ist sichtbar konfiguriert, nicht geerbt.** Wer die Bean liest, sieht sofort, dass hier eine Entscheidung offen ist.

Sessions sind stateless konfiguriert, CSRF ist abgeschaltet, CORS ist auf den Frontend-Devserver begrenzt — die Form, die eine spätere tokenbasierte Authentifizierung erwartet.

## Consequences

- Das Backend ist derzeit ungeschützt. Das ist gewollt und dokumentiert; es ist keine Lücke, sondern ein offener Punkt.
- **Diese Konfiguration darf nicht in Produktion gehen.** Der spätere Security-Schritt löst dieses ADR ab (`Superseded by`), statt es zu ergänzen.
- Die `SecurityFilterChain`-Bean nicht entfernen, weil sie „nichts tut". Sie zu löschen aktiviert Spring Boots Default-Absicherung und ändert das Verhalten still.
- Der Zustand ist `partial`: Die Bean existiert, das im ursprünglichen Entwurf vorgesehene JWT-Filter-Skelett nicht — an seiner Stelle steht ein `TODO`-Kommentar.

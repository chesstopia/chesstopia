---
name: api-endpoint
description: Fügt einen REST-Endpunkt OpenAPI-first hinzu — erst der Kontrakt in docs/api/openapi.yaml, dann das generierte Interface, dann der Controller. Verwenden, wenn ein neuer Endpunkt oder eine Änderung an einem bestehenden ansteht.
---

# Endpunkt hinzufügen

**Ein Endpunkt entsteht nie im Controller.** Er beginnt in
`docs/api/openapi.yaml`; der Controller implementiert danach das generierte
Interface. Das ist Verbot 2 aus `CLAUDE.md`, begründet in
[ADR-0008](../../../docs/adr/0008-openapi-first-codegen.md).

Kein Subagent, bewusst: Ein Endpunkt wird entworfen, nicht gefunden. Der
Entwurf gehört in das Gespräch, in dem die Anforderung steht.

## 1. Kontrakt

`docs/api/openapi.yaml` ist die Single Source of Truth für Backend **und**
Frontend. Konventionen:

- Pfad unter `/api/v1/`, **kebab-case** im Pfad, **camelCase** im JSON
- `operationId` in camelCase — daraus entsteht der Methodenname auf beiden
  Seiten. Sie einmal zu ändern, benennt Backend-Methode und Client-Funktion
  gleichzeitig um.
- `tags` bestimmt den Interface-Namen: `tags: [game]` → `GameApi`. Ein neuer
  Tag erzeugt ein neues Interface und damit implizit einen neuen Controller.
- Ausschließlich `application/json`. Kein HATEOAS.
- Response-Schemas unter `components/schemas`, mit `required` und `example`.

Validieren:

```
./gradlew :chesstopia-backend:openApiValidate
```

## 2. Generieren

```
./gradlew :chesstopia-backend:openApiGenerate   # Spring-Interfaces
./gradlew generateOpenApiClient                 # TypeScript-Axios-Client
```

Beide Ausgabeverzeichnisse — `chesstopia-backend/build/generated/openapi/` und
`openapi-client/src/` — sind gitignored und werden bei jedem Build neu
erzeugt. **Nichts darin wird editiert oder committet.**

Fällt der Generator unterschiedlich aus, obwohl die Spezifikation dieselbe
ist: Der Generator ist zweimal gepinnt, in `gradle/libs.versions.toml` und in
`openapi-client/openapitools.json`. Die beiden Zahlen müssen übereinstimmen.

## 3. Implementieren

Package-by-Feature: `io.chesstopia.backend.<feature>`, innerhalb des Features
klassische Schichtung. Der Controller implementiert das generierte Interface
und trägt **kein eigenes `@RequestMapping`** — Pfad und Methode stehen bereits
in der Annotation des Interfaces. Ein zweites Mapping im Controller erzeugt
einen zweiten Pfad und ist der übliche Weg, den Kontrakt unbemerkt zu
umgehen.

Vorlage ist
`chesstopia-backend/src/main/java/io/chesstopia/backend/game/GameController.java`:
`@RestController`, `implements <Tag>Api`, Konstruktorinjektion des Service,
`@Override` je Operation. Fachlogik liegt im Service, nicht im Controller.

Kein Lombok, kein MapStruct. Records und Handmapping.

**Schachregeln gehören nicht hierher.** Zuglogik, Legalitätsprüfung und
Stellungsbewertung liegen ausschließlich in `chess-engine`
([ADR-0001](../../../docs/adr/0001-kotlin-multiplatform-chess-engine.md)). Der
Endpunkt ruft die Engine auf und konvertiert `Array` mit `.toList()` **direkt
am Aufruf** — das Array-Format dringt nicht in die REST-Schicht.

Fehler als RFC-7807-`ProblemDetail` über den globalen `GlobalExceptionHandler`.
4xx ohne Logging, 5xx mit ERROR-Log.

## 4. Absichern

Kontexttests gegen die Datenbank brauchen `@AutoConfigureEmbeddedDatabase`
([ADR-0012](../../../docs/adr/0012-embedded-postgres-fuer-tests.md)) — ohne die
Annotation läuft der Test gegen die echte Datenbank und scheitert an der
Verbindung, nicht an der Annotation.

Zum Schluss `./gradlew buildAll`: Nur der Gesamtlauf beweist, dass Kontrakt,
Backend und Frontend-Client wieder zueinander passen.

## Keine Abweichung mehr

Jeder Endpunkt des Backends steht im Kontrakt; kein Controller trägt eine
eigene Mapping-Annotation. `checkDocs` erzwingt das als Fehler — wer den
Pfad in den Controller schreibt statt in die YAML, bricht den Build.

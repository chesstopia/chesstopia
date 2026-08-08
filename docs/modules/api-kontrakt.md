---
type: module
name: api-kontrakt
status: active
updated: 2026-08-08
adrs: [0006, 0008]
verifies:
  - 'docs/api/openapi.yaml :: openapi: 3.1.0'
  - '.gitignore :: openapi-client/src/'
---

# API-Kontrakt

## Zweck

`docs/api/openapi.yaml` ist die einzige Stelle, an der die REST-API zwischen Backend und Frontend definiert wird. Aus ihr entstehen die Spring-Interfaces und der TypeScript-Axios-Client — der Kontrakt ist keine Absprache, sondern ein generiertes Artefakt auf beiden Seiten.

Das *Warum* steht in [ADR-0008](../adr/0008-openapi-first-codegen.md). Hier stehen die Regeln, gegen die man beim Ändern verstößt.

## Gehört hierher

Pfade, Operationen, Statuscodes, Schemata — alles, was zwischen den beiden Prozessen über die Leitung geht. Der Ort ist immer die YAML, nie der Java- oder TypeScript-Code.

## Gehört NICHT hierher

**Ein neuer Endpunkt im Controller.** Er beginnt in der YAML; der Controller implementiert danach das generierte Interface.

**Handgeschriebene Clients.** `openapi-client/src/` ist gitignored und wird bei jedem Build überschrieben — jede Änderung dort ist beim nächsten `buildAll` weg.

**Schachlogik.** Der Kontrakt transportiert Zustand (etwa eine FEN), er berechnet keinen. Zugregeln liegen in `chess-engine` ([ADR-0001](../adr/0001-kotlin-multiplatform-chess-engine.md)).

## Der Weg von der YAML zum Code

```
docs/api/openapi.yaml
├── openApiGenerate      (Gradle JavaExec, Backend)
│   └── chesstopia-backend/build/generated/openapi/   → io.chesstopia.backend.api[.model]
└── generateOpenApiClient (PnpmTask → openapi-generator-cli)
    └── openapi-client/src/                           → @chesstopia/openapi-client
```

Zwei Generatorläufe, zwei Werkzeuge, eine Quelle. Beide Ausgabeverzeichnisse sind ignoriert.

## Invarianten

1. **`operationId` ist der Methodenname** — auf beiden Seiten. `getBoard` wird zu `GameApi.getBoard()` in Java *und* in TypeScript. Ein Umbenennen bricht die `@Override`-Methode im Controller und jeden Frontend-Aufruf gleichzeitig.
2. **`tags` bestimmt den Interface-Namen.** Der Generator läuft mit `useTags=true`: Tag `game` → `GameApi`. Ein geänderter Tag benennt die Klasse auf beiden Seiten um.
3. **Der Controller trägt kein eigenes `@RequestMapping`.** Der Pfad steht in der YAML; ein Pfad im Controller wäre eine zweite Wahrheit.
4. **Der Controller enthält keine Logik.** Er implementiert das generierte Interface und delegiert an einen Service. `GameController` ist das Muster.
5. **`interfaceOnly=true, skipDefaultInterface=true`** — der Generator erzeugt keine Default-Implementierung. Ein nicht implementierter Endpunkt bricht die Kompilierung, statt zur Laufzeit 501 zu liefern. Das ist gewollt.
6. **Konventionen:** Pfade unter `/api/v1/`, kebab-case; JSON-Felder camelCase; ausschließlich `application/json`; Fehler als RFC-7807-`ProblemDetail` über den `GlobalExceptionHandler`.

## Bekannte Abweichung

`/api/v1/counter` steht **nicht** in der YAML. `CounterController` ist der einzige Controller mit eigenem `@RequestMapping` und eigenem Response-Record. Er stammt aus der Zeit vor der Codegen-Kette und hat keinen Frontend-Konsumenten; sein Integrationstest spricht den Pfad direkt an.

Die Abweichung ist bekannt und nicht gedeckt — sie ist der Kandidat für den nächsten Aufräumschritt, nicht die Vorlage für neue Endpunkte.

## Einstiegspunkte

| Frage | Datei |
|---|---|
| Wie sieht die API aus? | `docs/api/openapi.yaml` |
| Wie wird das Backend generiert? | `chesstopia-backend/build.gradle.kts`, Task `openApiGenerate` |
| Wie der Client? | `openapi-client/package.json`, Skript `generate` |
| Wie sieht ein korrekter Controller aus? | `chesstopia-backend/src/main/java/io/chesstopia/backend/game/GameController.java` |

## Wellenwirkung

Eine Änderung an der YAML bewegt vier Artefakte in drei Sprachen:

| Änderung | Folge |
|---|---|
| neuer Pfad | Backend-Interface wächst um eine Methode → **Kompilierfehler**, bis der Controller sie implementiert |
| `operationId` umbenannt | Backend-`@Override` und Frontend-Aufruf brechen zugleich |
| `tag` geändert | Interface- und Client-Klassenname ändern sich, `implements` bricht |
| Feld zu `required` gemacht | Modelltyp ändert sich auf beiden Seiten |
| Feld nur in einem Generator sichtbar | tritt nicht auf, solange beide Generatoren dieselbe Version tragen — siehe [build-orchestrierung.md](build-orchestrierung.md), Invariante 7 |

Dass ein fehlender Endpunkt als Kompilierfehler auftritt und nicht als 404 zur Laufzeit, ist der eigentliche Gewinn dieser Konstruktion.

## Abhängigkeiten

- `chesstopia-backend` → generierte Interfaces aus diesem Kontrakt
- `chesstopia-frontend` → `@chesstopia/openapi-client` aus diesem Kontrakt
- Reihenfolge und Verdrahtung → [build-orchestrierung.md](build-orchestrierung.md)

*Dieser Block wird später generiert; bis dahin von Hand gepflegt.*

## Zugehörige Entscheidungen

- [ADR-0008](../adr/0008-openapi-first-codegen.md) — warum OpenAPI-First und Codegen statt handgeschriebener Clients
- [ADR-0006](../adr/0006-build-orchestration.md) — wie die beiden Generatorläufe im Build hängen

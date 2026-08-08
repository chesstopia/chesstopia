---
type: adr
status: accepted
implementation: partial
updated: 2026-08-08
supersedes: []
verifies:
  - 'chesstopia-backend/build.gradle.kts :: interfaceOnly=true'
---

# ADR-0008: OpenAPI-First + Code Generation — Backend Stubs und Frontend Axios Client

## Status
Accepted

## Context
Das Backend (Spring Boot/Java) und das Frontend (React/TypeScript) müssen über eine REST-API kommunizieren. Ohne gemeinsame Quelle entstehen drei typische Probleme:
- DTOs werden manuell doppelt gepflegt (Java-Record + TypeScript-Interface)
- HTTP-Methodensignaturen driften auseinander (Tippfehler, vergessene Felder)
- Client-seitige Fetch-Aufrufe sind untypisiert oder per Hand geschrieben

## Decision

`docs/api/openapi.yaml` ist die **Single Source of Truth** für die gesamte API. Aus ihr werden automatisch generiert:

### Backend: Spring-Interfaces (Java)
Der `openapi-generator-cli 7.22.0` läuft als Gradle-`JavaExec`-Task (`openApiGenerate`) direkt über das CLI-JAR — **kein Gradle-Plugin**.

Konfiguration:
- Generator: `spring`
- `interfaceOnly=true` — nur das Interface, keine Controller-Implementierung
- `skipDefaultInterface=true` — abstrakte Methoden statt `default`-Bodies; Compiler erzwingt vollständige Implementierung
- `useTags=true` — ein Interface pro OpenAPI-Tag (z.B. `HelloApi`)
- `documentationProvider=none` — kein SpringDoc/Swagger-UI overhead
- `openApiNullable=false` — kein `JsonNullable`-Wrapper

Der generierte Code landet in `build/generated/openapi/src/main/java/` (nicht committet). Das `compileJava`-Task hängt von `openApiGenerate` ab — kein manueller Schritt notwendig.

Ein Controller implementiert das Interface direkt, ohne eigenes `@RequestMapping`:
```java
@RestController
public class HelloController implements HelloApi {
    @Override
    public ResponseEntity<HelloResponse> getHello() { … }
}
```

Kein Gradle-Plugin statt JavaExec: Das `org.openapi.generator`-Plugin hat historisch Kompatibilitätsprobleme mit neueren Gradle-Versionen gezeigt. Die JavaExec-Variante (direkter JAR-Aufruf) ist stabiler, IDE-unabhängig und ohne Plugin-Classpath-Konflikte.

### Frontend: TypeScript Axios Client
Der `@openapitools/openapi-generator-cli` (npm) generiert via `pnpm run generate` einen TypeScript-Axios-Client nach `openapi-client/src/`. Das Paket `@chesstopia/openapi-client` ist ein pnpm-Workspace-Paket und wird im Frontend via `"workspace:*"` eingebunden.

### Generierter Code wird nicht committet
`openapi-client/src/` ist in `.gitignore`. `buildAll` generiert beide Artefakte frisch:
1. `:chesstopia-backend:compileJava` → `openApiGenerate` → Spring-Interfaces
2. `generateOpenApiClient` → TypeScript Axios Client

## Consequences
- Neue API-Endpunkte beginnen immer in `docs/api/openapi.yaml` — nie direkt im Controller
- Vergessene Implementierungen werden als Compilerfehler sichtbar (kein `default`-Body)
- DTOs existieren nur einmal: als Schema in der YAML, als generiertes Java-Record und als generiertes TypeScript-Interface
- Entwickler müssen nach YAML-Änderungen `openApiGenerate` / `generateOpenApiClient` ausführen (oder `buildAll`); die IDE zeigt bis dahin rote Imports für generierte Klassen
- `openApiValidate` kann als eigenständiger CI-Schritt eingebunden werden um die YAML früh zu prüfen
- Der Generator ist an `7.22.0` fixiert (`openapitools.json`); Updates sind bewusste Upgrades mit Sichtkontrolle der Diff

# Plan: OpenAPI Code Generation — Backend Stubs + Frontend Axios Client

## Ziel

Eine zentrale `openapi.yaml` ist die Single Source of Truth für die gesamte API.
Aus ihr werden automatisch generiert:
- **Backend**: Spring-Interfaces (Java) → werden im Backend implementiert
- **Frontend**: TypeScript Axios Client → wird im React-Frontend verwendet

Kein manuelles Schreiben von DTOs, Controller-Signaturen oder HTTP-Clients.

---

## 1. OpenAPI YAML anlegen

**Ablageort:** `docs/api/openapi.yaml`

Zentrales Verzeichnis, da sowohl Backend- als auch Frontend-Generator darauf zugreifen.

**Hello World Endpunkt als erster Schnitt:**

```yaml
openapi: 3.1.0
info:
  title: Chesstopia API
  version: 0.0.1

servers:
  - url: /api/v1

paths:
  /hello:
    get:
      operationId: getHello
      summary: Hello World
      tags:
        - hello
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HelloResponse'

components:
  schemas:
    HelloResponse:
      type: object
      required:
        - message
      properties:
        message:
          type: string
          example: "Hello from Chesstopia!"
```

---

## 2. Backend Stub-Generation (Gradle)

### Plugin

`org.openapi.generator` Gradle Plugin in `chesstopia-backend/build.gradle.kts`.

**Aktuelle kompatible Version prüfen** (Stand Plan: `7.x`).
In `gradle/libs.versions.toml` eintragen:

```toml
[versions]
openapi-generator = "7.x.x"

[plugins]
openapi-generator = { id = "org.openapi.generator", version.ref = "openapi-generator" }
```

### Konfiguration in `chesstopia-backend/build.gradle.kts`

```kotlin
openApiGenerate {
    generatorName.set("spring")
    inputSpec.set("$rootDir/docs/api/openapi.yaml")
    outputDir.set(layout.buildDirectory.dir("generated/openapi").map { it.asFile.path })
    apiPackage.set("io.chesstopia.backend.api")
    modelPackage.set("io.chesstopia.backend.api.model")
    configOptions.set(mapOf(
        "interfaceOnly"    to "true",   // nur Interface, keine Impl
        "useSpringBoot3"   to "true",
        "useTags"          to "true",   // ein Interface pro Tag
        "documentationProvider" to "none"
    ))
}

// Generierte Quellen dem compile-Classpath bekannt machen
sourceSets["main"].java.srcDir(
    layout.buildDirectory.dir("generated/openapi/src/main/java")
)

// compileJava hängt von der Generierung ab
tasks.named("compileJava") {
    dependsOn("openApiGenerate")
}
```

### Ergebnis

Der Generator erzeugt ein Interface pro OpenAPI-Tag, z.B.:

```java
// generiert — nicht anfassen
@Tag(name = "hello")
@RequestMapping("/api/v1")
public interface HelloApi {
    @GetMapping("/hello")
    ResponseEntity<HelloResponse> getHello();
}
```

### Implementierung im Backend

Ein neuer Controller im Feature-Package implementiert das Interface:

```java
// io/chesstopia/backend/hello/HelloController.java
@RestController
public class HelloController implements HelloApi {

    @Override
    public ResponseEntity<HelloResponse> getHello() {
        return ResponseEntity.ok(new HelloResponse().message("Hello from Chesstopia!"));
    }
}
```

Kein `@RequestMapping` nötig — kommt aus dem generierten Interface.

---

## 3. Frontend Axios Client Generation

### Ansatz

Der `openapi-generator` wird als pnpm-Script ausgeführt (über `@openapitools/openapi-generator-cli`).
Das Ergebnis landet in einem dedizierten Paket im pnpm-Workspace.

### Workspace-Paket: `openapi-client/`

Neues Verzeichnis im Monorepo-Root: `openapi-client/`

```
openapi-client/
  package.json          # name: "@chesstopia/openapi-client"
  generate.sh           # ruft openapi-generator-cli auf
  src/                  # generierter Code (committed oder gitignored — entscheiden)
```

`package.json`:
```json
{
  "name": "@chesstopia/openapi-client",
  "version": "0.0.1",
  "scripts": {
    "generate": "openapi-generator-cli generate -i ../docs/api/openapi.yaml -g typescript-axios -o src/"
  },
  "devDependencies": {
    "@openapitools/openapi-generator-cli": "^2.x.x"
  },
  "dependencies": {
    "axios": "^1.x.x"
  }
}
```

In `pnpm-workspace.yaml` eintragen:
```yaml
packages:
  - 'chess-engine'
  - 'openapi-client'
  - 'frontend'        # sobald angelegt
```

### Gradle-Integration

Im Root-`build.gradle.kts` einen `generateOpenApiClient`-Task registrieren, der `pnpm run generate` im `openapi-client`-Paket ausführt und von `pnpmInstall` abhängt:

```kotlin
tasks.register<com.github.gradle.node.pnpm.task.PnpmTask>("generateOpenApiClient") {
    group = "openapi"
    description = "Generates the TypeScript Axios client from docs/api/openapi.yaml"
    workingDir = file("openapi-client")
    args.set(listOf("run", "generate"))
    dependsOn("pnpmInstall")
}
```

`buildAll` erweitern:
```kotlin
tasks.named("buildAll") {
    dependsOn("generateOpenApiClient")
}
```

### Nutzung im Frontend

```typescript
import { HelloApi, Configuration } from '@chesstopia/openapi-client';

const api = new HelloApi(new Configuration({ basePath: 'http://localhost:8080' }));
const response = await api.getHello();
console.log(response.data.message);
```

---

## 4. Gradle Task-Übersicht nach Umsetzung

| Task | Was passiert |
|---|---|
| `:chesstopia-backend:openApiGenerate` | Generiert Java-Interfaces aus `openapi.yaml` |
| `:chesstopia-backend:compileJava` | Kompiliert Backend inkl. generierter Sources |
| `:generateOpenApiClient` | Generiert TypeScript Axios Client |
| `buildAll` | chess-engine (JVM+JS) + Backend-Stubs + TS-Client + pnpm |

---

## 5. Offene Entscheidungen

| Frage | Optionen |
|---|---|
| Generierten TS-Client committen? | Ja (einfacher CI-Start) vs. Nein (nur `openapi.yaml` committen, Client on-the-fly) |
| openapi-generator Version | `7.x` prüfen auf Spring Boot 4 / Spring 7 Kompatibilität |
| `useSpringBoot3` Flag | In Spring Boot 4 ggf. durch neueres Flag ersetzen (prüfen) |
| Validierung der YAML im CI | `openapi-generator validate` als eigenen Task |

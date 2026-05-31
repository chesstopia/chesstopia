# chess-engine

Kotlin Multiplatform chess rules engine for Chesstopia. Compiles to two artifacts:

- **JVM JAR** — consumed by the Spring Boot backend via Gradle Composite Build
- **JS Library + TypeScript Declarations** — consumed by the React frontend via pnpm Workspace

## Prerequisites

- JDK 25 (e.g. via SDKMAN: `sdk install java 25-open && sdk use java 25-open`)
- `JAVA_HOME` must point to JDK 25

Node.js and pnpm are downloaded automatically by Gradle — no manual install required.

## Building

### Full monorepo build (recommended)

From the monorepo root (`chesstopia/`):

```bash
./gradlew buildAll
```

Builds chess-engine for JVM and JS, then runs `pnpm install` to link the pnpm workspace.

### Build chess-engine only

```bash
# JVM + JS
./gradlew :chess-engine:build

# JVM JAR only
./gradlew :chess-engine:jvmJar

# JS library only (for frontend)
./gradlew :chess-engine:jsBrowserProductionLibraryDistribution
```

## Testing

```bash
# All targets (JVM + Node.js)
./gradlew :chess-engine:allTests

# JVM only
./gradlew :chess-engine:jvmTest

# JS only (runs in Node.js, no browser required)
./gradlew :chess-engine:jsNodeTest
```

Test reports after the run:

- JVM: `build/reports/tests/jvmTest/index.html`
- JS:  `build/reports/tests/jsNodeTest/index.html`

## Build outputs

| Artifact | Path |
|----------|------|
| JVM JAR | `build/libs/chess-engine-jvm-0.0.1.jar` |
| JS module | `build/dist/js/productionLibrary/chess-engine.js` |
| TypeScript declarations | `build/dist/js/productionLibrary/chess-engine.d.ts` |

## Consuming this library

### Spring Boot backend

`backend/settings.gradle.kts`:
```kotlin
includeBuild("../chess-engine")
```

`backend/build.gradle.kts`:
```kotlin
dependencies {
    implementation("io.chesstopia:chess-engine")
}
```

### React frontend

`frontend/package.json`:
```json
{
  "dependencies": {
    "@chesstopia/chess-engine": "workspace:*"
  }
}
```

After `pnpm install` the package is available with full TypeScript types:
```typescript
import { getLegalMoves, RuleSet, Variant } from '@chesstopia/chess-engine'

const result = getLegalMoves(fen, RuleSet.standard())
// result: LegalMovesResult with moves: Move[], isCheck, isCheckmate, isStalemate
```

## Source structure

```
src/
└── commonMain/kotlin/io/chesstopia/engine/
    ├── ChessEngine.kt   # getLegalMoves(), validateMove(), applyMove()
    ├── Move.kt          # Move data class
    └── RuleSet.kt       # RuleSet + Variant enum
```

All public types are annotated with `@JsExport` — TypeScript declarations are generated automatically.

## Notes

- `kotlin-js-store/yarn.lock` is used internally by the Kotlin/JS plugin for build tooling (Karma, webpack) — this is **not** the project's pnpm lockfile
- Browser-based JS tests are disabled (no Chrome on CI) — JS tests run in Node.js instead

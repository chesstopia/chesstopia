import com.github.gradle.node.pnpm.task.PnpmInstallTask
import com.github.gradle.node.pnpm.task.PnpmTask

plugins {
    alias(libs.plugins.node.gradle)
}

// Documentation consistency checks — deliberately not wired into `check`,
// see the header of the script for why.
apply(from = "gradle/check-docs.gradle.kts")

node {
    // Node.js version managed by the plugin — no manual install required
    version = "22.14.0"
    pnpmVersion = "9.15.9"
    download = true
    workDir = file("${rootDir}/.gradle/nodejs")
    // pnpmInstall runs in the project directory (root) by default,
    // which is where pnpm-workspace.yaml lives — no extra config needed
}

// Ensure the chess-engine JS library is built before pnpm links the workspace package
tasks.named<PnpmInstallTask>("pnpmInstall") {
    dependsOn(gradle.includedBuild("chess-engine").task(":jsBrowserProductionLibraryDistribution"))
}

// Vite production build for the React frontend
tasks.register<PnpmTask>("pnpmFrontendBuild") {
    dependsOn("pnpmInstall")
    args.set(listOf("--filter", "chesstopia-frontend", "build"))
    inputs.dir("chesstopia-frontend/src")
    inputs.file("chesstopia-frontend/index.html")
    inputs.file("chesstopia-frontend/package.json")
    outputs.dir("chesstopia-frontend/dist")
}

// ESLint check for the React frontend (CI gate)
tasks.register<PnpmTask>("pnpmFrontendLint") {
    dependsOn("pnpmInstall")
    args.set(listOf("--filter", "chesstopia-frontend", "lint"))
}

// Vitest unit tests for the React frontend (CI gate)
tasks.register<PnpmTask>("pnpmFrontendTest") {
    dependsOn("pnpmInstall")
    args.set(listOf("--filter", "chesstopia-frontend", "test"))
}

// Generate the TypeScript Axios client from docs/api/openapi.yaml
tasks.register<PnpmTask>("generateOpenApiClient") {
    group = "openapi"
    description = "Generates TypeScript Axios client from docs/api/openapi.yaml"
    args.set(listOf("--filter", "@chesstopia/openapi-client", "run", "generate"))
    dependsOn("pnpmInstall")
    inputs.file("docs/api/openapi.yaml")
    outputs.dir("openapi-client/src")
}

/**
 * Full monorepo build:
 *   1. chess-engine → JVM jar (consumed by Spring Boot via composite build)
 *   2. chess-engine → JS library + .d.ts (consumed by React via pnpm workspace)
 *   3. pnpm install → links workspace packages in node_modules
 *   4. openapi-client → TypeScript Axios client (from docs/api/openapi.yaml)
 *   5. chesstopia-backend → Spring Boot jar (incl. generated Spring interfaces)
 *   6. Vite → React frontend bundle (chesstopia-frontend/dist/)
 *
 * Usage: ./gradlew buildAll
 */
tasks.register("buildAll") {
    group = "build"
    description = "Builds chess-engine (JVM + JS), generates OpenAPI clients, builds Spring Boot backend and React frontend"
    dependsOn(
        gradle.includedBuild("chess-engine").task(":build"),
        "generateOpenApiClient",
        ":chesstopia-backend:build",
        "pnpmFrontendBuild"
    )
}

/**
 * CI stage 1: build and test the chess-engine standalone (JVM jar + JS library, incl. tests).
 * Runs first so its task outputs populate the Gradle build cache; the parallel backend and
 * frontend stages then get cache hits for the same chess-engine tasks instead of rebuilding.
 * chess-engine has no standalone wrapper, so it is driven through the composite build here.
 */
tasks.register("chessEngineBuild") {
    group = "build"
    description = "Builds and tests the chess-engine (JVM + JS) — CI stage 1, warms the build cache"
    dependsOn(gradle.includedBuild("chess-engine").task(":build"))
}

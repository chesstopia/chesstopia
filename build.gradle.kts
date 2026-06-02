import com.github.gradle.node.pnpm.task.PnpmInstallTask
import com.github.gradle.node.pnpm.task.PnpmTask

plugins {
    alias(libs.plugins.node.gradle)
}

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

/**
 * Full monorepo build:
 *   1. chess-engine → JVM jar (consumed by Spring Boot via composite build)
 *   2. chess-engine → JS library + .d.ts (consumed by React via pnpm workspace)
 *   3. pnpm install → links @chesstopia/chess-engine in node_modules
 *   4. chesstopia-backend → Spring Boot jar
 *   5. Vite → React frontend bundle (chesstopia-frontend/dist/)
 *
 * Usage: ./gradlew buildAll
 */
tasks.register("buildAll") {
    group = "build"
    description = "Builds chess-engine (JVM + JS), Spring Boot backend, links the pnpm workspace, and builds the React frontend"
    dependsOn(
        gradle.includedBuild("chess-engine").task(":build"),
        ":chesstopia-backend:build",
        "pnpmFrontendBuild"
    )
}

import org.jetbrains.kotlin.gradle.targets.js.yarn.YarnLockMismatchReport
import org.jetbrains.kotlin.gradle.targets.js.yarn.YarnPlugin
import org.jetbrains.kotlin.gradle.targets.js.yarn.YarnRootExtension

plugins {
    alias(libs.plugins.kotlin.multiplatform)
}

// Kotlin/JS uses Yarn internally to manage its own tooling (karma, webpack etc.).
// Auto-replace the lock file instead of failing the build on every change.
plugins.withType<YarnPlugin> {
    the<YarnRootExtension>().apply {
        yarnLockMismatchReport = YarnLockMismatchReport.NONE
        yarnLockAutoReplace = true
    }
}

group = "io.chesstopia"
version = "0.0.1"

kotlin {
    // Toolchain applies to all JVM targets — must be at extension scope in Kotlin 2.3+
    jvmToolchain(25)

    // JVM target — consumed by Spring Boot backend via Gradle composite build.
    // -java-parameters: der EngineMapper (MapStruct) matcht die Primärkonstruktoren
    // der @JsExport-data-class-Typen über die Parameternamen.
    jvm {
        compilerOptions {
            javaParameters = true
        }
    }

    // JS target — consumed by React frontend via pnpm workspace
    js(IR) {
        outputModuleName.set("chess-engine")
        browser {
            // No browser (Chrome) available on CI/dev servers — tests run via nodejs below
            testTask { enabled = false }
        }
        nodejs {
            // JS tests run in Node.js — no browser install required
            testTask {
                testLogging { events("passed", "failed", "skipped") }
                useMocha { timeout = "60s" }
            }
        }
        // Library mode: produces chess-engine.js + chess-engine.d.ts
        // Output: build/dist/js/productionLibrary/
        binaries.library()
        // Generate TypeScript declarations for all @JsExport-annotated types
        generateTypeScriptDefinitions()
    }

    sourceSets {
        commonMain.dependencies {
            // No external dependencies — pure Kotlin chess logic
        }

        commonTest.dependencies {
            implementation(kotlin("test"))
        }

        // jvmMain and jsMain source sets exist implicitly.
        // Platform-specific code goes here only if truly necessary.
    }
}

val corpusDir = layout.projectDirectory.dir("testcases")
val generatedCorpusDir = layout.buildDirectory.dir("generated-corpus/kotlin")

val generateCorpusTests by tasks.registering {
    description = "Erzeugt je testcases/**/*.case eine @Test-Methode in GeneratedCorpusTest"
    inputs.dir(corpusDir).withPropertyName("cases")
    outputs.dir(generatedCorpusDir).withPropertyName("generated")
    doLast {
        val root = corpusDir.asFile
        val pkgDir = generatedCorpusDir.get().asFile.resolve("io/chesstopia/engine/corpus").apply { mkdirs() }
        fun esc(s: String) = s
            .replace("\\", "\\\\").replace("\"", "\\\"")
            .replace("\$", "\\\$").replace("\r", "").replace("\n", "\\n")

        val cases = if (root.isDirectory)
            root.walkTopDown().filter { it.isFile && it.extension == "case" }.sortedBy { it.invariantSeparatorsPath }.toList()
        else emptyList()

        val methods = cases.joinToString("\n\n") { file ->
            val rel = file.relativeTo(root).invariantSeparatorsPath
            val name = rel.removeSuffix(".case").replace("/", " · ")
            "    @kotlin.test.Test\n" +
                "    fun `$name`() = CorpusRunner.run(\"${esc(file.readText())}\", \"$rel\")"
        }

        pkgDir.resolve("GeneratedCorpusTest.kt").writeText(
            "// GENERIERT von generateCorpusTests — nicht editieren, nicht committen (build/ ist gitignored)\n" +
                "package io.chesstopia.engine.corpus\n\n" +
                "class GeneratedCorpusTest {\n\n$methods\n}\n"
        )
    }
}

tasks.matching { it.name == "compileTestKotlinJvm" || it.name == "compileTestKotlinJs" }
    .configureEach { dependsOn(generateCorpusTests) }

kotlin.sourceSets.named("commonTest") { kotlin.srcDir(generatedCorpusDir) }

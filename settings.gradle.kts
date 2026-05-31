rootProject.name = "chesstopia"

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.9.0"
}

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
}

// chess-engine is a standalone Gradle project included as a composite build.
// The backend subproject inherits this substitution — no separate includeBuild needed there.
includeBuild("chess-engine")

include(":chesstopia-backend")

rootProject.name = "chess-engine"

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

// Foojay Toolchain Resolver: Gradle auto-downloads the required JDK (here: 25)
// if it is not installed locally. No manual JDK install needed on CI or new machines.
plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.9.0"
}

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
}

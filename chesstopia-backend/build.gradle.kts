plugins {
    java
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
}

group = "io.chesstopia"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

// ── OpenAPI Code Generation ───────────────────────────────────────────────────

val openapiGeneratorCli by configurations.creating

val openApiSpec = rootProject.file("docs/api/openapi.yaml")
val openApiOutputDir = layout.buildDirectory.dir("generated/openapi")

tasks.register<JavaExec>("openApiValidate") {
    group = "openapi"
    description = "Validates docs/api/openapi.yaml"
    classpath = openapiGeneratorCli
    mainClass.set("org.openapitools.codegen.OpenAPIGenerator")
    args = listOf("validate", "-i", openApiSpec.absolutePath, "--recommend")
}

tasks.register<JavaExec>("openApiGenerate") {
    group = "openapi"
    description = "Generates Spring interfaces from docs/api/openapi.yaml"
    classpath = openapiGeneratorCli
    mainClass.set("org.openapitools.codegen.OpenAPIGenerator")
    args = listOf(
        "generate",
        "-i", openApiSpec.absolutePath,
        "-g", "spring",
        "-o", openApiOutputDir.get().asFile.absolutePath,
        "--api-package", "io.chesstopia.backend.api",
        "--model-package", "io.chesstopia.backend.api.model",
        "--global-property", "apis,models",
        "--additional-properties",
        "interfaceOnly=true,useSpringBoot3=true,useTags=true," +
        "documentationProvider=none,openApiNullable=false,skipDefaultInterface=true"
    )
    inputs.file(openApiSpec)
    outputs.dir(openApiOutputDir)
}

sourceSets["main"].java.srcDir(openApiOutputDir.map { it.dir("src/main/java") })

tasks.named("compileJava") {
    dependsOn("openApiGenerate")
}

// ── Dependencies ──────────────────────────────────────────────────────────────

dependencies {
    openapiGeneratorCli(libs.openapi.generator.cli)
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-flyway")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    implementation("io.chesstopia:chess-engine")
    implementation(libs.logstash.logback.encoder)
    implementation(libs.mapstruct)
    annotationProcessor(libs.mapstruct.processor)

    runtimeOnly("org.postgresql:postgresql")

    developmentOnly("org.springframework.boot:spring-boot-devtools")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    // Required for WebTestClient to bind to the live RANDOM_PORT server in this Spring MVC app:
    // starter-webflux supplies the reactive HTTP client (reactor-netty), spring-boot-webtestclient
    // the @AutoConfigureWebTestClient slice (extracted into its own module in Spring Boot 4).
    testImplementation("org.springframework.boot:spring-boot-starter-webflux")
    testImplementation("org.springframework.boot:spring-boot-webtestclient")
    testImplementation(libs.zonky.embedded.database.spring.test)
    // Non-Docker provider: runs Postgres from downloaded native binaries (no Docker daemon
    // needed, in CI or locally). Selected via zonky.test.database.provider=zonky (application-test.yml).
    testImplementation(libs.zonky.embedded.postgres)
}

tasks.withType<JavaCompile> {
    // Suppress deprecation warnings from generated OpenAPI sources (e.g. @Nullable migration in Spring 7)
    options.compilerArgs.addAll(listOf(
        "-Xlint:-deprecation",
        "-Amapstruct.defaultComponentModel=spring",
        "-Amapstruct.unmappedTargetPolicy=ERROR",
    ))
}

tasks.withType<Test> {
    useJUnitPlatform()
}

// Deterministic artifact name for the artifact-copy Dockerfile; disable the plain jar.
tasks.bootJar { archiveFileName.set("app.jar") }
tasks.named<Jar>("jar") { enabled = false }

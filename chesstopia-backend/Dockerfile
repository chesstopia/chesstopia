# Single-stage artifact-copy image: the pre-built Spring Boot jar (app.jar) is
# produced by the pipeline with a warm Gradle cache and copied in directly.
# No Gradle build runs inside this Docker layer.
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY build/libs/app.jar app.jar
RUN useradd -r -u 1001 spring
USER spring
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]

# Chesstopia

Eine Schachplattform mit geteilter Regel-Engine: Backend und Frontend validieren Züge gegen **dieselbe** Kotlin-Multiplatform-Bibliothek, und die REST-API zwischen ihnen wird aus einer OpenAPI-Spezifikation generiert statt abgesprochen.

## Bauen und starten

Voraussetzung ist ein JDK; Node und pnpm bringt der Build selbst mit.

```bash
./gradlew buildAll                     # alles: Engine (JVM + JS), Codegen, Backend, Frontend
./gradlew :chesstopia-backend:bootRun  # Backend starten
pnpm --filter chesstopia-frontend dev  # Frontend-Devserver
```

## Weiter

Die Dokumentation liegt in **[docs/index.md](docs/index.md)** — welche Module es gibt, wie sie zusammenhängen und was bereits gebaut ist.

Wer mit einem KI-Agenten in diesem Repo arbeitet: Die verbindlichen Regeln stehen in [CLAUDE.md](CLAUDE.md).

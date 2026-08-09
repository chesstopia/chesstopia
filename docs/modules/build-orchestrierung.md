---
type: module
name: build-orchestrierung
status: active
updated: 2026-08-08
adrs: [0001, 0006, 0008]
verifies:
  - 'settings.gradle.kts :: includeBuild("chess-engine")'
  - 'pnpm-workspace.yaml :: verifyDepsBeforeRun: false'
  - '.gitignore :: openapi-client/src/'
---

# Build-Orchestrierung

## Zweck

Vier Build-Systeme — Gradle, openapi-generator, pnpm und Vite — auf einen einzigen Befehl reduzieren. `./gradlew buildAll` baut den vollständigen Monorepo-Stand; Gradle hält die Reihenfolge, nicht der Mensch und kein Skript.

Das *Warum* dieser Konstruktion steht vollständig in [ADR-0006](../adr/0006-build-orchestration.md) und wird hier nicht wiederholt. Dieses Dokument beschreibt die heutige Topologie und die Regeln, gegen die man beim Arbeiten verstößt.

## Gehört hierher

Alles, was Reihenfolge, Verdrahtung und Werkzeugversionen betrifft:

- `settings.gradle.kts` — welches Projekt ist Composite Build, welches Subprojekt
- `build.gradle.kts` (Root) — die `PnpmTask`-Instanzen und `buildAll`
- `pnpm-workspace.yaml` — welche Verzeichnisse pnpm als Workspace-Pakete kennt
- `gradle/libs.versions.toml` — der Versionskatalog

## Gehört NICHT hierher

**Fachlogik jeder Art.** Die Orchestrierung kennt Artefakte und Reihenfolgen, keine Schachregeln und keine Endpunkte.

**Versionsnummern in Dokumenten.** Sie stehen in `gradle/libs.versions.toml`, in `build.gradle.kts` (Node und pnpm) und in `openapi-client/openapitools.json` — abgeschriebene Versionen driften unbemerkt.

**Ein neues Gradle-Subprojekt für Frontend oder Client.** Beide sind bewusst keine Gradle-Projekte; sie werden ausschließlich über `PnpmTask` angesteuert ([ADR-0006](../adr/0006-build-orchestration.md)).

## Topologie

```
chesstopia (Gradle-Root)
├── includeBuild("chess-engine")   ← eigenständiges Gradle-Projekt, eigene settings.gradle.kts
└── include(":chesstopia-backend") ← einziges echtes Subprojekt

pnpm-Workspace (Root, pnpm-workspace.yaml)
├── chess-engine        → @chesstopia/chess-engine    (Inhalt von Gradle erzeugt)
├── openapi-client      → @chesstopia/openapi-client  (Inhalt vom Generator erzeugt)
└── chesstopia-frontend → Konsument beider
```

`chess-engine` liegt in beiden Welten: als Gradle-Composite-Build für die JVM-Seite, als pnpm-Workspace-Paket für die JS-Seite. Dieselben Quellen, zwei Ausgabeziele.

## Invarianten

1. **`buildAll` ist der kanonische Einstiegspunkt.** Wer einen Teilschritt einzeln aufruft, muss dessen Vorbedingungen selbst kennen.
2. **Java ist die einzige Voraussetzung.** Node und pnpm lädt das node-gradle-Plugin selbst herunter. Eine Anleitung, die eine lokale Node-Installation verlangt, ist falsch.
3. **Generierter Code wird nie committet.** Betroffen sind `openapi-client/src/` und `chesstopia-backend/build/generated/openapi/`.
4. **Kein `publishToMavenLocal`, kein `npm link`.** Gradle substituiert `io.chesstopia:chess-engine` zur Build-Zeit, pnpm löst `workspace:*` lokal auf. Ein manueller Zwischenschritt ist immer ein Symptom, nie eine Lösung.
5. **pnpm installiert nicht von selbst.** `verifyDepsBeforeRun: false` ist Absicht: Die Workspace-Pakete werden von Gradle gefüllt, nicht von pnpm geholt. Ein Auto-Install zur Skriptlaufzeit kämpft gegen die Build-Reihenfolge.
6. **Gradle nie mit `sudo`.** Root-eigene Dateien in `.gradle/` und `build/` brechen den nächsten regulären Build.
7. **Der Generator ist an zwei Stellen gepinnt** — im Versionskatalog für die JVM-Seite und in `openapi-client/openapitools.json` für die JS-Seite. Beide müssen dieselbe Version tragen, sonst erzeugen Backend und Frontend Clients aus verschiedenen Generatorgenerationen. Es gibt heute nichts, das das prüft.

## Einstiegspunkte

| Frage | Datei |
|---|---|
| Was gehört zum Build? | `settings.gradle.kts` |
| In welcher Reihenfolge läuft was? | `build.gradle.kts` (Root), Task `buildAll` |
| Was kennt pnpm? | `pnpm-workspace.yaml` |
| Welche Version? | `gradle/libs.versions.toml` |

## Wellenwirkung

| Änderung | erzwingt |
|---|---|
| neues Gradle-Modul | Eintrag in `settings.gradle.kts` **und** in `buildAll.dependsOn` — sonst baut es nur, wenn man es direkt aufruft |
| neues JS-Paket | Eintrag in `pnpm-workspace.yaml`, danach `pnpm install` |
| Ausgabepfad der JS-Library geändert | `chess-engine/package.json` (`main`, `types`) zeigt ins Leere |
| `docs/api/openapi.yaml` geändert | beide Generatoren laufen — siehe [api-kontrakt.md](api-kontrakt.md) |
| Generator-Version angehoben | an **beiden** Pin-Stellen, siehe Invariante 7 |

## Abhängigkeiten

- `chess-engine` → keine (Composite Build, ohne externe Abhängigkeiten)
- `chesstopia-backend` → `chess-engine` (JVM-Jar)
- `chesstopia-frontend` → `chess-engine` (ESM), `openapi-client`
- `openapi-client` → `docs/api/openapi.yaml`

*Dieser Block wird später aus den Build-Dateien generiert; bis dahin von Hand gepflegt.*

## Zugehörige Entscheidungen

- [ADR-0006](../adr/0006-build-orchestration.md) — warum Composite Build, pnpm-Workspace und node-gradle-Plugin
- [ADR-0001](../adr/0001-kotlin-multiplatform-chess-engine.md) — warum `chess-engine` zwei Ausgabeziele hat
- [ADR-0008](../adr/0008-openapi-first-codegen.md) — warum zwei Generatorläufe im Build hängen

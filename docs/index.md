---
type: note
status: current
updated: 2026-08-08
---

# Chesstopia — Karte

Der Einstiegspunkt in die Dokumentation. Diese Datei beantwortet **was hier gebaut ist und wie es zusammenhängt**. Die Regeln für die Arbeit im Repo stehen in [CLAUDE.md](../CLAUDE.md), das *Warum* der Architektur in den [ADRs](adr/index.md).

## Der rote Faden

Chesstopia ist eine Schachplattform. Die eine Entscheidung, aus der die Struktur folgt: **Schachregeln existieren genau einmal.** `chess-engine` ist Kotlin Multiplatform und wird zweimal ausgeliefert — als JVM-Jar ans Backend, als ES-Modul ans Frontend. Beide Seiten validieren gegen dieselbe Implementierung, ohne dass sie doppelt geschrieben wird ([ADR-0001](adr/0001-kotlin-multiplatform-chess-engine.md)).

Die zweite tragende Entscheidung ist die Gegenrichtung: **die REST-API existiert auch genau einmal**, als `docs/api/openapi.yaml`. Aus ihr werden die Spring-Interfaces und der TypeScript-Client generiert ([ADR-0008](adr/0008-openapi-first-codegen.md)). Zusammen bedeutet das: Die beiden Nahtstellen zwischen Backend und Frontend — Schachlogik und Datenkontrakt — sind keine Absprachen, sondern generierte Artefakte.

Alles andere ordnet sich dem unter. `buildAll` ist der kanonische Einstiegspunkt, weil beide Generatoren in der richtigen Reihenfolge laufen müssen ([ADR-0006](adr/0006-build-orchestration.md)).

## Module

| Modul | Rolle | Beschreibung |
|---|---|---|
| `chess-engine` | Schachregeln, KMP → JVM + JS | — |
| `chesstopia-backend` | Spring Boot, REST + WebSocket | — |
| `chesstopia-frontend` | React/Vite | — |
| `openapi-client` | generierter TS-Client, gitignored | — |
| `docs/api/openapi.yaml` | API-Kontrakt | — |

Die Spalte *Beschreibung* verweist später auf `modules/<modul>.md`. Die Dokumente entstehen noch.

## Stand der Umsetzung

Ehrlich und knapp, weil hier der größte Abstand zwischen Absicht und Realität liegt:

- **Domäne:** [context.md](context.md) beschreibt 25 Begriffe. Umgesetzt ist davon ein Bruchteil.
- **Engine:** drei Quelldateien in `commonMain` — `ChessEngine`, `Move`, `RuleSet`. Das Gerüst steht, die Regellogik nicht.
- **Backend:** drei Controller. `hello` und `counter` sind Durchstiche durch die Codegen-Kette; `game` liefert eine konstante Start-FEN.
- **Frontend:** Brett-Darstellung mit FEN-Parsing.
- **API:** zwei Pfade — `/api/v1/game/board` und `/api/v1/hello`.

Der Wert des bisher Gebauten liegt nicht in den Features, sondern in der durchgestochenen Kette: Eine Änderung an `openapi.yaml` bewegt nachweislich vier Artefakte in drei Sprachen.

## Wegweiser

| Frage | Ort |
|---|---|
| Was darf ich als Agent hier nicht tun? | [CLAUDE.md](../CLAUDE.md) |
| Warum ist etwas so entschieden? | [adr/index.md](adr/index.md) |
| Was bedeutet dieser Domänenbegriff? | [context.md](context.md) |
| Wie sieht die API aus? | [api/openapi.yaml](api/openapi.yaml) |

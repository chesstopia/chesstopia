---
type: note
status: current
updated: 2026-08-13
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
| `docs/api/openapi.yaml` | API-Kontrakt | [api-kontrakt.md](modules/api-kontrakt.md) |
| Root-Build | Reihenfolge über vier Build-Systeme | [build-orchestrierung.md](modules/build-orchestrierung.md) |

Zwei Modulbeschreibungen existieren, vier fehlen. Die beiden vorhandenen sind bewusst zuerst entstanden: Sie beschreiben die Nahtstellen, an denen eine Änderung mehrere Module gleichzeitig bewegt — das Wissen, das bisher nur in Sessionverläufen existierte. Die übrigen vier folgen; bis dahin ist der Code die Auskunft.

## Stand der Umsetzung

Ehrlich und knapp, weil hier der größte Abstand zwischen Absicht und Realität liegt:

- **Domäne:** [context.md](context.md) beschreibt 25 Begriffe. Umgesetzt ist davon ein Bruchteil.
- **Engine:** die Mechanik eines Zuges steht — eine FEN wird gelesen, fortgeschrieben und zurückgegeben, samt Rochaderechten, En-passant-Ziel und beiden Zählern. Darüber liegt jetzt die **Regellogik**: `getLegalMoves` erzeugt die tatsächlich legalen Züge samt Schach-, Matt-, Patt- und 50-Züge-Erkennung sowie SAN-Notation ([ADR-0001](adr/0001-kotlin-multiplatform-chess-engine.md)).
- **Backend:** Partien und ihre Züge liegen in der Datenbank; ein Zug geht durch die Engine und wird als Ereignis angehängt ([ADR-0003](adr/0003-move-event-log.md)). Ein Zug wird nur noch angenommen, wenn er legal ist; Matt, Patt oder die 50-Züge-Regel setzen die Partie auf `COMPLETED`, weitere Züge werden dann abgelehnt. `hello` und `counter` bleiben Durchstiche durch die Codegen-Kette.
- **Frontend:** Brett mit Figuren, die sich per Zeiger ziehen lassen.
- **Sicherheit und Spieler:** keine. Jede Partie ist für jeden erreichbar ([ADR-0015](adr/0015-security-von-tag-eins.md)).

Der Wert des bisher Gebauten liegt nicht in den Features, sondern in der durchgestochenen Kette: Eine Änderung an `openapi.yaml` bewegt nachweislich vier Artefakte in drei Sprachen — und seit dem 10. August 2026 wird die Engine tatsächlich gerufen, statt nur eingebunden zu sein.

## Wegweiser

| Frage | Ort |
|---|---|
| Was darf ich als Agent hier nicht tun? | [CLAUDE.md](../CLAUDE.md) |
| Warum ist etwas so entschieden? | [adr/index.md](adr/index.md) |
| Was bedeutet dieser Domänenbegriff? | [context.md](context.md) |
| Wie ist das Backend eingerichtet? | [notes/backend-konventionen.md](notes/backend-konventionen.md) |
| Was darf ich in diesem Modul nicht tun? | [modules/](modules/) |
| Wie ist etwas konkret eingerichtet? | [notes/](notes/) |
| Wie sieht die API aus? | [api/openapi.yaml](api/openapi.yaml) |

---
type: note
status: current
updated: 2026-09-02
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
| `chess-engine` | Schachregeln, KMP → JVM + JS | [chess-engine.md](modules/chess-engine.md) |
| `chesstopia-backend` | Spring Boot, REST + WebSocket | — |
| `chesstopia-frontend` | React/Vite | — |
| `openapi-client` | generierter TS-Client, gitignored | — |
| `docs/api/openapi.yaml` | API-Kontrakt | [api-kontrakt.md](modules/api-kontrakt.md) |
| Root-Build | Reihenfolge über vier Build-Systeme | [build-orchestrierung.md](modules/build-orchestrierung.md) |

Drei Modulbeschreibungen existieren, drei fehlen. Die vorhandenen sind bewusst zuerst entstanden: Sie beschreiben die Nahtstellen, an denen eine Änderung mehrere Module gleichzeitig bewegt — das Wissen, das bisher nur in Sessionverläufen existierte. Die übrigen drei folgen; bis dahin ist der Code die Auskunft.

## Stand der Umsetzung

Ehrlich und knapp, weil hier der größte Abstand zwischen Absicht und Realität liegt:

- **Domäne:** [context.md](context.md) beschreibt 25 Begriffe. Umgesetzt ist davon ein Bruchteil.
- **Engine:** Die Zugvalidierung ist vollständig — Gangart, Weg, Fesselung, kein Selbstschach, Rochade-/En-passant-Bedingungen; dazu Schach-, Matt-, Patt-Erkennung und die Remis-Regeln (50 Züge, ungenügendes Material, Dreifachwiederholung über `gameOutcome`). Ein Perft-Orakel und ein datei-getriebener Testkorpus sichern das ab ([ADR-0022](adr/0022-datei-getriebener-engine-testkorpus.md)). Offen bleibt allein `getLegalMoves` an der `@JsExport`-Grenze — der Aufruf ist zwar exportiert, wirft aber weiterhin `NotImplementedError` (interner Generator existiert, ist nur nicht angeschlossen).
- **Backend:** Partien und ihre Züge liegen in der Datenbank; ein Zug geht durch die Engine und wird als Ereignis angehängt ([ADR-0003](adr/0003-move-event-log.md)). Das `game`-Feature ist hexagonal geschnitten — Domäne, Ports, Adapter ([ADR-0020](adr/0020-hexagonale-architektur-und-notationsfreie-domaene.md)); `hello` und `counter` bleiben klassische Durchstiche durch die Codegen-Kette.
- **Frontend:** Brett mit Figuren, die sich per Zeiger ziehen lassen und die vor dem Senden gegen die Engine geprüft werden; eine beendete Partie sperrt das Brett und zeigt das Ergebnis.
- **Sicherheit und Spieler:** keine. Jede Partie ist für jeden erreichbar ([ADR-0015](adr/0015-security-von-tag-eins.md)).

**Ein Zug wird auf beiden Seiten auf Legalität geprüft** — das Frontend blockiert illegale Züge vor dem Senden ([frontend-engine-validierung.md](notes/frontend-engine-validierung.md)), das Backend bleibt autoritativ und setzt bei Matt/Patt/Remis den Partiestatus.

Der Wert des bisher Gebauten liegt nicht in den Features, sondern in der durchgestochenen Kette: Eine Änderung an `openapi.yaml` bewegt nachweislich vier Artefakte in drei Sprachen — und seit dem 10. August 2026 wird die Engine tatsächlich gerufen, statt nur eingebunden zu sein.

## Wegweiser

| Frage | Ort |
|---|---|
| Was darf ich als Agent hier nicht tun? | [CLAUDE.md](../CLAUDE.md) |
| Warum ist etwas so entschieden? | [adr/index.md](adr/index.md) |
| Was bedeutet dieser Domänenbegriff? | [context.md](context.md) |
| Wie ist das Backend eingerichtet? | [notes/backend-konventionen.md](notes/backend-konventionen.md) |
| Wie spricht das Frontend die API an? | [notes/frontend-api-anbindung.md](notes/frontend-api-anbindung.md) |
| Wie prüft das Frontend Züge vorab? | [notes/frontend-engine-validierung.md](notes/frontend-engine-validierung.md) |
| Was darf ich in diesem Modul nicht tun? | [modules/](modules/) |
| Wie ist etwas konkret eingerichtet? | [notes/](notes/) |
| Wie sieht die API aus? | [api/openapi.yaml](api/openapi.yaml) |

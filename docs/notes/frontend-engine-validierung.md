---
type: note
status: current
updated: 2026-09-04
verifies:
  - "chesstopia-frontend/src/lib/engine.ts :: validateMove"
  - "chesstopia-frontend/src/hooks/useBoardState.ts :: isLegalMove"
---

# Frontend-Validierung gegen die Engine

Wie das Frontend einen Zug prüft, bevor er das Backend erreicht.

## Warum doppelt

Das Frontend prüft vor dem Senden gegen dieselbe Engine, gegen die auch das Backend prüft ([ADR-0001](../adr/0001-kotlin-multiplatform-chess-engine.md)) — keine zweite, abweichende Implementierung. Das Backend bleibt trotzdem die autoritative Instanz und validiert unverändert selbst. Illegale Züge erreichen das Backend dadurch gar nicht erst; die Figur springt im Frontend zurück.

## `src/lib/engine.ts`

Das TypeScript-Pendant zum `EngineMapper`: Es übersetzt die openapi-client-Typen (String-Enums) in die `@JsExport`-Objekte der Engine. Exportiert ist bislang nur `isLegalMove` — `getLegalMoves` ist an der `@JsExport`-Grenze noch `TODO`.

## Tests

`useBoardState.test.ts` mockt `@/lib/engine` (nicht das Roh-Paket `@chesstopia/chess-engine`); `engine.test.ts` läuft gegen das echte JS-Artefakt und braucht vorher `./gradlew buildAll`.

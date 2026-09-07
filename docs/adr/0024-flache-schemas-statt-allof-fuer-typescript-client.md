---
type: adr
status: accepted
implementation: complete
updated: 2026-09-07
supersedes: []
verifies: []
---

# ADR-0024: Flache Objektschemas statt `allOf`-Komposition für Schemas, die der TypeScript-Axios-Client konsumiert

## Status
Accepted

## Context
`docs/api/openapi.yaml` speist zwei Generatoren aus einer Datei — Spring für das Backend, `typescript-axios` für den Frontend-Client ([ADR-0006](0006-build-orchestration.md), [ADR-0008](0008-openapi-first-codegen.md)). `GameCreatedResponse` war ursprünglich per `allOf` komponiert: `$ref` auf `GameResponse` plus ein inline-Objektschema mit `ownerToken`/`inviteToken`, ohne Discriminator.

Der Spring-Generator flacht diese Komposition korrekt zu einem vollständigen POJO mit allen fünf `GameResponse`-Feldern plus `ownerToken`/`inviteToken` ab. Der `typescript-axios`-Generator (die Version liegt in `openapi-client/openapitools.json`) kollabiert dieselbe Komposition stattdessen zu einem reinen Typalias auf `GameResponse` — `export type GameCreatedResponse = GameResponse;` — und verliert `ownerToken`/`inviteToken` dabei vollständig, ohne Fehler oder Warnung zur Generierungszeit. Das fiel erst auf, als generierter Aufrufcode (`res.data.ownerToken`) nicht mehr gegen den TypeScript-Typ kompilierte, obwohl das tatsächliche JSON vom Backend die Felder enthält.

## Considered Options
- **Generator-Flag `generateAliasAsModel=true`** — getestet, ohne Wirkung. Das Flag steuert einen anderen Fall (Schemas, die vollständig als Alias erkannt werden), nicht die hier vorliegende Fehlklassifizierung komponierter Schemas.
- **Zusätzliches `type: object` neben `allOf` stehen lassen** — getestet, ohne Wirkung. Der Generator kollabiert weiterhin auf den reinen `$ref`.
- **Generiertes TypeScript-Modell von Hand nachbessern** — verworfen. Verstößt gegen CLAUDE.md Verbot 1 (generierter Code wird nie editiert) und wäre bei jedem Build wieder verschwunden.
- **Flaches `type: object`-Schema, das alle Felder von `GameResponse` dupliziert und um `ownerToken`/`inviteToken` ergänzt** — gewählt. Keine Komposition, also keine Fläche für den Generator-Bug.

## Decision
Schemas in `docs/api/openapi.yaml`, die vom `typescript-axios`-Client konsumiert werden, komponieren nicht per `allOf` aus einem `$ref` plus einem additiven Inline-Objekt ohne Discriminator. Stattdessen listet ein flaches `type: object`-Schema alle Felder explizit, auch wenn sie mit einem anderen Schema übereinstimmen.

`GameCreatedResponse` ist entsprechend umgestellt: kein `allOf` mehr, stattdessen ein eigenständiges Objektschema mit `id`, `position`, `status`, `endReason`, `moveCount`, `ownerToken`, `inviteToken`.

## Consequences
- Ein künftiges Response-Schema, das ein anderes erweitern oder mit ihm komponieren soll, verwendet standardmäßig ein flaches, vollständig ausgeschriebenes Objektschema — es sei denn, die tatsächliche `typescript-axios`-Ausgabe wurde vorher verifiziert.
- Feldduplikate zwischen verwandten Schemas (z. B. `GameResponse` und `GameCreatedResponse`) sind eine bewusst in Kauf genommene Redundanz in der YAML-Quelle, nicht ein Fehler.
- Der Spring-Generator ist von diesem Bug nicht betroffen; diese Regel gilt trotzdem für die gesamte Datei, weil beide Generatoren aus derselben Quelle laufen und ein künftiger `allOf`-Fall sonst leicht unbemerkt in dieselbe Falle liefe.
- Behebt ein künftiges Generator-Upgrade diesen Bug, wird dieses ADR auf `superseded`/`partially-superseded` gesetzt statt die Regel stillschweigend rückgängig zu machen.

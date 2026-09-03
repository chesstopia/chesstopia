---
type: adr
status: accepted
implementation: complete
updated: 2026-09-02
supersedes: ['0014']
verifies:
  - 'chesstopia-backend/build.gradle.kts :: annotationProcessor(libs.mapstruct.processor)'
  - 'gradle/libs.versions.toml :: mapstruct'
  - 'chess-engine/build.gradle.kts :: javaParameters'
---

# ADR-0021: MapStruct für die Adapter-Mappings — wo es passt

## Status
Accepted

Ergänzung (CHESS-13-Gegenvorschlag): Alle vier Adapter-Mapper sind inzwischen `@Mapper(componentModel = "spring")`-Interfaces. Die beiden im Body genannten Handmapping-Ausnahmen sind entfallen:

- `EngineMapper` — die Brett-Brücke ist seit [ADR-0020](0020-hexagonale-architektur-und-notationsfreie-domaene.md) `PlacedPiece[]` ↔ `Map` (zwei `default`-Methoden) statt `Array<Piece?>` ↔ `Map` mit Index-Mathematik. `-java-parameters` im Engine-JVM-Build lässt MapStruct die Kotlin-`data class`-Primärkonstruktoren per Parametername treffen. Die generierten erschöpfenden Enum-`switch`es machen einen Engine-Enum-Wert ohne Domänen-Pendant zum Compile-Fehler statt zum Laufzeit-`IllegalArgumentException`.
- `GameEntityMapper` — der Split des Persistenz-Packages in `entities/` und `mapper/` macht `PartieEntity`/`ZugEntity` `public` mit `public`-Accessoren. Die flache `Move`-Zerlegung löst MapStruct über Quell-Pfade (`source = "move.from"`); `Position ↔ PositionJson` und `Square ↔ "e2"` kommen über `uses = PositionJsonMapper.class`. `id`/`partieId` setzt weiterhin der `GamePersistenceAdapter` nach dem Mapping.

`SquareCodec` bleibt ein package-private Helfer in `mapper/`. Die hand-geschriebenen `default`-Methoden der Mapper (Sortierung, Null-Guards, `Map` ↔ Sammlung) tragen je einen eigenen Unit-Test; die generierten Abbildungen nicht.

## Context

[ADR-0020](0020-hexagonale-architektur-und-notationsfreie-domaene.md) erzeugt vier nicht-triviale Adapter-Mapper: `EngineMapper`, `GameEntityMapper`, `PositionJsonMapper` und `WebMapper`. Sie bilden Enums über den Namen ab, entpacken verschachtelte Records und konvertieren Sammlungen — Handmapping, das mit dem Kontrakt und dem Schema driftet.

[ADR-0014](0014-minimaler-dependency-kern.md) hat genau diesen Fall vorgesehen: „Wird [Handmapping] messbar teuer, ist das der Anlass, MapStruct erneut zu prüfen — nicht vorher." Mit vier Mappern auf einen Schlag ist der Auslöser erreicht.

## Considered Options

- **Weiter alle vier von Hand** — verworfen: vier Mapper sind der von [ADR-0014](0014-minimaler-dependency-kern.md) benannte Auslöser.
- **Zusätzlich Lombok** — verworfen: die Domäne ist bewusst `record`-lastig und immutable, Lombok spart hier nichts, und die Build-Magie-Kritik aus [ADR-0014](0014-minimaler-dependency-kern.md) steht.
- **MapStruct aufnehmen** — gewählt; Lombok bleibt draußen.

## Decision

MapStruct wird aufgenommen (Version in `gradle/libs.versions.toml`), als `implementation` und `annotationProcessor`. Global gilt `mapstruct.defaultComponentModel=spring` und `mapstruct.unmappedTargetPolicy=ERROR` — jedes nicht abgebildete Zielfeld bricht den Build.

MapStruct wird dort verwendet, wo es trägt: `PositionJsonMapper` und `WebMapper` sind `@Mapper(componentModel = "spring")`-Interfaces.

Zwei Mapper bleiben von Hand geschrieben, weil MapStruct ihre Eigenschaften nicht liest:

- `EngineMapper` — die `chess-engine`-Typen sind Kotlin-`data class`es, deren Property-Modell MapStruct nicht sauber sieht; die Brett-Konvertierung `Array<Piece?>` ↔ `Map<Square, Piece>` ist ohnehin reiner Handcode. `EngineMapper` ist eine Utility-Klasse mit statischen Methoden, die `ChessEngineAdapter` aufruft.
- `GameEntityMapper` — die JPA-Entities sind package-private, MapStruct meldet „no properties". Er ist eine `@Component`-Klasse, in die `PositionJsonMapper` injiziert wird.

`SquareCodec` (Domäne ↔ Feld-String `"e2"`) ist ein schlichter Helfer, den beide Persistenz-Mapper nutzen.

## Consequences

- Der Build bekommt einen Annotation-Processor — genau die Art, die [ADR-0014](0014-minimaler-dependency-kern.md) in den Consequences ausschließt („Ein Stacktrace zeigt Code, den man im Editor sehen kann"). Bewusst in Kauf genommen: der generierte OpenAPI-Code ist bereits so eine Konzession, und `unmappedTargetPolicy=ERROR` macht das stille Weglassen eines Feldes unmöglich.
- Abgelöst ist allein die MapStruct-Klausel aus [ADR-0014](0014-minimaler-dependency-kern.md). Der übrige Dependency-Kern — kein Lombok, kein Spring Cloud, kein Redis, kein Spring Batch — gilt unverändert.
- Das gemischte Ergebnis (zwei MapStruct, zwei von Hand) ist das ehrliche Resultat der Grenzen von MapStruct mit Kotlin-`data class`es und package-private Beans. Ein künftiger Mapper wählt MapStruct nur, wenn Quelle und Ziel Bean-Properties offenlegen.

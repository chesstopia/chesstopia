---
type: adr
status: accepted
implementation: complete
updated: 2026-09-04
supersedes: []
verifies:
  - 'chess-engine/build.gradle.kts :: generateCorpusTests'
  - 'chess-engine/testcases/pawn/double-step-from-start.case :: description ='
---

# ADR-0022: Datei-getriebener Engine-Testkorpus

## Status
Accepted

## Context
Phase 1 gibt der Engine echte Regeln. [ADR-0019](0019-teststrategie.md) legt den schachspezifischen Randfallkatalog in das `/tests`-Skill „als Gedächtnis" — ein Prosakatalog ist aber nicht ausführbar. Gesucht: breite Abdeckung von Schach*situationen*, von Hand geschrieben, für das Auge auf einen Blick erfassbar, leicht zu erweitern. EPD/FEN-Formate scheiden aus ([ADR-0020](0020-hexagonale-architektur-und-notationsfreie-domaene.md): notationsfrei; zudem nicht „auf einen Blick"). `commonTest` in KMP hat weder Laufzeit-Dateizugriff noch `@ParameterizedTest`.

## Considered Options
- **Laufzeit-Dateilesen mit kotlinx-io/Okio** — JVM + Node möglich, aber neue `commonTest`-Abhängigkeit (berührt [ADR-0014](0014-minimaler-dependency-kern.md)) und der Arbeitsverzeichnis-Unterschied JVM ↔ Kotlin/JS-Node.
- **EPD/FEN als Format** — Notation, gegen ADR-0020; nicht auf einen Blick lesbar.
- **JVM-only `@TestFactory` mit Laufzeitlesen** — echte Parametrisierung ohne Codegen, aber der Korpus liefe nicht auf dem JS-Target, wo Kotlin/JS-Compiler-Divergenz gerade das KMP-spezifische Risiko ist.
- **Ein Sammel-`@Test`, der über eine generierte Liste iteriert** — ein roter Fall verdeckt die übrigen; jeder Fall verdient eine eigene Reportzeile.
- **YAML als Format** — kein Multiplatform-YAML-Parser ohne neue Abhängigkeit; Einrückung von Hand fehleranfällig.

## Decision
Ein Verzeichnis `chess-engine/testcases/<kategorie>/<name>.case` mit einer Situation je Datei — zwei ASCII-Bretter nebeneinander (INITIAL / EXPECTED) plus Kopf-Metadaten (`description`, `ruleset`, `move`, `legal`, Flags). Ein Gradle-Task `generateCorpusTests` liest sie vor `compileTestKotlin{Jvm,Js}` und erzeugt **eine `@Test` je Datei** in `commonTest` (Inhalt als maskiertes String-Literal eingebettet). Handgeschrieben: `CorpusParser` + `CorpusRunner` (je eigener Unit-Test), die `validateMove`/`applyMove`/`gameOutcome` treiben und die volle Ergebnis-`Position` vergleichen. Perft (`PerftTest.kt`) ist ein **getrenntes** Orakel — Referenz-Knotenzahlen, nicht von Hand geschrieben.

## Consequences
- Eine neue `.case`-Datei wird erst nach einem Gradle-Sync zum Test — akzeptiert, in `.claude/skills/tests/SKILL.md` dokumentiert.
- Die generierte Datei liegt unter `build/` (gitignored); lesbar zum Debuggen, nicht editierbar (CLAUDE.md Verbot 1 sinngemäß).
- Der Randfallkatalog aus ADR-0019 bekommt ein ausführbares Zuhause; das `/tests`-Skill verweist darauf.
- `chess-engine` bekommt ein Top-Level-`testcases/` und einen Codegen-Task in `build.gradle.kts`.

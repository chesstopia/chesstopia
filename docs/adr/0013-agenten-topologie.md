---
type: adr
status: accepted
implementation: partial
updated: 2026-08-08
supersedes: []
verifies:
  - '.claude/agents/build-doctor.md :: name: build-doctor'
  - '.claude/agents/session-harvester.md :: name: session-harvester'
  - '.claude/skills/adr/SKILL.md :: name: adr'
  - '.claude/skills/api-endpoint/SKILL.md :: name: api-endpoint'
  - '.gitignore :: .claude/settings.local.json'
---

# ADR-0013: Agenten-Topologie — zwei Subagenten, zwei Skills, drei Schwellen

## Status
Accepted

## Context

Die Arbeit an diesem Repository findet überwiegend mit KI-Agenten statt. Damit
stellt sich eine Frage, die vor der ersten Agentendatei beantwortet sein muss:
**Welche Aufgaben bekommen einen eigenen Agenten, und welche nicht?**

Ohne Antwort entsteht der übliche Verlauf — für jede wiederkehrende Tätigkeit
wird ein Agent angelegt, bis niemand mehr weiß, welcher wofür zuständig ist,
und die Agentendateien dieselbe Drift entwickeln wie die Dokumentation, die sie
pflegen sollen. Eine Agentendatei ist ein Dokument; sie fällt unter dieselbe
Türschwelle wie jedes andere.

Der Zustand zum Entscheidungszeitpunkt ist ungewöhnlich und prägt die
Entscheidung: **790 Zeilen Quellcode in 27 Dateien, vier Testdateien, zwei
API-Pfade — gegen 19 Dokumente.** Das Wissensmanagement ist größer als der Code,
den es beschreibt. Ein Agentenpark, dimensioniert nach dem, was man sich an
Aufgaben vorstellen kann, wäre in diesem Verhältnis grotesk.

Maßgeblich war deshalb nicht, welche Agenten nützlich *wären*, sondern was in
diesem Repository tatsächlich schiefgegangen ist. Das Ergebnis dieser Messung
ist der eigentliche Inhalt dieser Entscheidung: **Fast jeder reale Fehler war
deterministisch prüfbar** — die doppelt vergebene ADR-Nummer, die
„Gradle 8.x"-Falschaussage, fehlende Pflichtabschnitte, eine von nirgends
verlinkte Notiz, ein toter Katalogeintrag. Alle fängt inzwischen
`./gradlew checkDocs` zu Nullkosten pro Lauf. Genau **eine** Fehlerklasse hat
eine wiederkehrende Historie und ist nicht skriptbar: sieben der letzten zwanzig
Commits reparieren Build oder Pipeline.

## Considered Options

- **Ein Agent je wiederkehrender Aufgabe** — der naheliegende Zuschnitt: je ein
  Agent für ADRs, für API-Endpunkte, für Doku-Drift, für Doku-Audit, für den
  Build. Abgelehnt, weil er Werkzeugklassen verwechselt. Drei dieser fünf
  Aufgaben brauchen keinen isolierten Kontext, sondern das Gegenteil.
- **Gar keine Agenten, nur Skripte und Skills** — verlockend nach der obigen
  Messung. Abgelehnt an der einen Fehlerklasse, die sie nicht abdeckt: Ein roter
  Build erzeugt hunderte Zeilen Gradle-, Kotlin/JS- und Stacktrace-Ausgabe,
  deren Auswertung Urteilsvermögen braucht und deren Rohtext nicht in den
  Hauptkontext gehört.
- **Agenten nach Modulgrenze** — je ein Frontend- und ein Backend-Agent.
  Abgelehnt, weil die riskanten Änderungen dieses Projekts genau die sind, die
  **quer** durch die Module laufen: Eine Änderung an `openapi.yaml` bewegt vier
  Artefakte in drei Sprachen ([ADR-0008](0008-openapi-first-codegen.md)), eine
  an der Engine zwei Konsumenten
  ([ADR-0001](0001-kotlin-multiplatform-chess-engine.md)). Ein Agent mit
  Modulscheuklappen ist an genau diesen Stellen blind.
- **Alles sofort bauen, auch die Agenten für später** — abgelehnt. Vier ADRs
  beschreiben derzeit Absicht statt Bestand; ein Doku-Audit-Agent hätte heute
  keine Struktur, von der etwas abweichen könnte.

## Decision

Ein Kandidat wird nur gebaut, wenn er **alle vier** Bedingungen erfüllt: die
Aufgabe kehrt wieder; sie braucht Urteilsvermögen, ist also nicht skriptbar; sie
trägt Kontext, den ein Agent nicht aus dem Code ableiten kann; und sie profitiert
von Isolation.

Bedingung 4 ist die trennschärfste. Ein Subagent startet **kalt** — er erbt das
laufende Gespräch nicht. Aufgaben der Form *breit lesen, knapp berichten* sind
für ihn ideal; tief kontextabhängige Aufgaben sind der denkbar schlechteste
Zuschnitt.

Daraus folgt die Aufteilung auf drei Werkzeugklassen:

**Deterministisch prüfbar → `checkDocs`, kein Agent.** Kostet nichts pro Lauf,
läuft in CI, kann nicht irren. Alles, was ein Skript entscheiden kann, wird
niemals einem Agenten übergeben.

**Kontextabhängig → Skill.** `/adr` und `/api-endpoint` sind Skills, keine
Subagenten. Die Begründung eines ADR und der Entwurf eines Endpunkts entstehen
in dem Gespräch, in dem die Anforderung steht; sie an einen kalt startenden
Agenten zu geben, wirft genau dieses Material weg. **Wenn das Denken im Gespräch
passiert ist, gehört die Ausführung ins Gespräch.**

**Breit lesen, knapp berichten → Subagent.** Gebaut werden zwei:

- **`build-doctor`** (Sonnet) — die einzige Fehlerklasse mit belastbarer
  Historie und nicht skriptbar. Ausführungslastig, nicht abstraktionslastig; der
  Fehler ist am Ende objektiv sichtbar, ein Fehlurteil kostet einen weiteren
  Lauf.
- **`session-harvester`** (Sonnet) — Diagnosen gehen bislang restlos verloren.
  Ein Sessionverlauf umfasst zweistellige Megabyte; die Ausgabe sind null bis
  drei Absätze. Er schlägt vor und schreibt nie.

**Bewusst nicht gebaut** — und diese Liste ist der Hauptzweck dieses Dokuments:

| Nicht gebaut | Grund |
|---|---|
| Code-Reviewer | `/code-review` existiert bereits im Werkzeugkasten |
| Test-Autor | Bei vier Testdateien ohne Gegenstand; das Urteil, *was* geprüft gehört, bleibt beim Autor |
| Frontend-/Backend-Agent | Die riskanten Änderungen laufen quer durch die Module |
| Repo-Such-Agent | `Explore` ist genau das |
| Alles, was `checkDocs` kann | Ein Agent, der Prüfbares prüft, ist teurer und unzuverlässiger |

**Drei weitere Agenten haben einen benannten Auslöser und werden bis dahin nicht
angelegt:**

- **`doc-sentinel`** — ab dem zweiten Menschen im Projekt, oder sobald Code und
  Doku nicht mehr in derselben Session entstehen. Schweigedrift ist unsichtbar,
  *weil* Autor und Dokumentierer verschieden sind.
- **`doc-auditor`** — sobald drei ADRs von `planned` auf `complete` wechseln
  oder `docs/` dreißig Dateien überschreitet. Der Auslöser ist am
  `implementation`-Feld ablesbar.
- **`engine-referee`** — sobald `RuleSet` legale Züge erzeugt. Schachregeln sind
  objektiv gegen bekannte Zugbaumzählungen prüfbar, und
  [ADR-0001](0001-kotlin-multiplatform-chess-engine.md) greift hier gegen sich
  selbst: Eine Implementierung und zwei Konsumenten heißt, dass ein Regelfehler
  zweimal identisch ausgeliefert wird — der Abgleich zwischen Client und Server
  ist per Konstruktion blind dafür.

Agenten und Skills liegen unter `.claude/` und sind **versioniert**, weil sie
Projektwissen tragen. `.claude/settings.local.json` ist persönlich und wird
ignoriert.

Ein Agent wird von Hand aufgerufen, bis er dreimal einen echten Befund geliefert
hat. Danach — und erst danach — steht eine automatische Auslösung zur Debatte.

## Consequences

Zwei Subagenten und zwei Skills statt fünf Agenten, bei gleicher Abdeckung
derselben Aufgaben.

Wer eine neue Agentenidee hat, prüft sie zuerst gegen die Tabelle der bewusst
nicht gebauten Agenten und gegen die vier Bedingungen. Fällt eine Aufgabe unter
„deterministisch prüfbar", ist die richtige Antwort eine weitere Regel in
`gradle/check-docs.gradle.kts` — nicht eine Agentendatei.

Es gibt **keinen** Agenten, der Tests schreibt, Code reviewt oder das Repository
durchsucht. Wer so etwas vermisst, greift zu `/code-review` beziehungsweise
`Explore`; beides existiert bereits.

Die drei Schwellenagenten dürfen erst angelegt werden, wenn ihr Auslöser
eingetreten ist. Bis dahin sind sie kein Rückstand, sondern eine Entscheidung.

Es gilt dasselbe Abbruchkriterium wie für jeden anderen Mechanismus dieses
Projekts: **Ein Agent, der über drei Läufe hinweg keinen echten Befund geliefert
hat, wird gelöscht — nicht optimiert.**

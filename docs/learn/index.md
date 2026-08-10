---
type: note
status: current
updated: 2026-08-10
---

# Lernpfad

Lektionen sind eine eigene Gattung neben ADR und Notiz ([ADR-0020](../adr/0020-lernkonzept.md)). Ein ADR erklärt eine Entscheidung **von innen** — warum hier, damals, unter diesen Zwängen. Eine Lektion erklärt das Feld **von außen**: was das Verfahren ist, was es sonst gibt, was davon außerhalb von Chesstopia gilt.

Sie ist deshalb kein Ersatz für die Karte. Wer wissen will, *was* hier gebaut ist, liest [docs/index.md](../index.md). Wer wissen will, *warum* etwas so entschieden wurde, liest das [ADR-Register](../adr/index.md). Eine Lektion beantwortet die dritte Frage: **wozu gehört das, und woran erkenne ich es beim nächsten Mal.**

## Zwei Spuren, keine Reihenfolge

**Spur A — das System.** Wie Chesstopia gebaut ist: geteilte Wahrheit statt abgesprochener, die Kette vom Kontrakt zum Artefakt, Anzeige und Zustand im Frontend, das Framework im Backend, der Sprung ins Internet.

**Spur B — die Arbeit am System.** Wie an Chesstopia gearbeitet wird: Wissen, das nicht verrottet; Arbeiten mit Agenten; der Weg einer Entscheidung nach `main`.

Zwischen den Spuren gibt es **keinen Fortschritt** — es sind zwei Gegenstände, nicht zwei Schwierigkeitsgrade. Innerhalb einer Spur ebenfalls keine Freischaltung: Wo eine Lektion eine andere wirklich voraussetzt, sagt sie es in `## Weiter`.

## Geschrieben

Spur A ist vollständig — sie erklärt, was heute im Repo läuft:

- [01 — Wenn zwei Programme dasselbe wissen müssen](01-architektur-und-schnittfuehrung.md) · geteilte Wahrheit statt abgesprochener, und wo ein Modulschnitt sich lohnt
- [02 — Das Artefakt von gestern](02-build-kette.md) · Abhängigkeitsgraph statt Anleitung, Erzeugung aus einer Quelle, die Plattformgrenze im Typ
- [03 — Wenn die Anzeige zur Wahrheit wird](03-frontend-react-dom-tests.md) · DOM, React, Zustand, und wo die vierte Testebene fehlt
- [04 — Wenn das Drumherum größer ist als die Sache](04-backend-spring-und-persistenz.md) · abgegebene Kontrolle, Schema als Geschichte, Fehler als Kontrakt
- [05 — Wenn es im Internet steht](05-sicherheit-und-betrieb.md) · sichtbare Vorgabewerte, Struktur gegen Wert, ersetzbar gegen unersetzlich

Spur B ist noch nicht geschrieben. Was noch nicht hier steht, ist nicht versäumt, sondern nicht geschrieben — und eine Lektion ohne laufenden Gegenstand im Repo wäre ein Lehrbuchkapitel ohne Fall.

**Eine Reihenfolge gibt es innerhalb der Spur nur dort, wo eine Lektion es sagt.** Wer bei null anfängt, liest 01 zuerst, weil die übrigen auf dem Schnitt aufsetzen, den sie erklärt. Alles danach ist unabhängig.

## Wie eine Lektion gelesen wird

Der Textteil liegt hier und ist in Obsidian wie im Texteditor vollständig lesbar. Die **Sprossen** — die ausgeführten Stufen der Komplexitätsleiter — liegen unter [learn-examples/](../../learn-examples/) und werden im Editor gelesen, nicht im Vault: Obsidian rendert kein TypeScript. Der Bruch im Lesefluss ist bekannt und in Kauf genommen; dafür läuft jede Sprosse, und `./gradlew pnpmLearnExamplesTest` beweist es bei jedem Build.

Am Ende jeder Lektion stehen Fragen ohne Antworten. Das ist Absicht: Die Antwort ist die Lektion, und eine mitgelieferte Antwort verwandelt Abrufen in Nachschlagen.

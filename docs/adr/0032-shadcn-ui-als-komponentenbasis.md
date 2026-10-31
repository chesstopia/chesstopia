---
type: adr
status: accepted
implementation: complete
updated: 2026-10-29
supersedes: []
verifies:
  - 'chesstopia-frontend/components.json :: shadcn'
  - 'chesstopia-frontend/src/components/ui/button.tsx :: Button'
---

# ADR-0032: shadcn/ui als Komponentenbasis des Frontends

## Status
Accepted

## Context
shadcn/ui und Tailwind kamen mit dem Gerüst-Commit `dea7a34` ins Frontend, ohne dass je jemand die Wahl begründet hätte. Bisher ist nur `button` aus shadcn eingebaut; Karten, Dialoge, Hinweise und Badges sind selbst gebaut oder fehlen.

Das Frontend wird jetzt gestaltet. Damit steht die Frage an, auf welcher Komponentenbasis das geschieht: die vorhandene beibehalten und konsequent nutzen, oder wechseln, solange noch fast nichts darauf aufbaut. Das Schachbrett ist mit Tailwind gebaut und soll es bleiben.

## Considered Options
- **Mantine.** Verworfen: Es bringt ein eigenes Styling-System mit. Neben Tailwind liefen zwei Ansätze parallel, oder das Brett müsste umgebaut werden.
- **MUI.** Verworfen aus demselben Grund: eigenes Styling-System (Emotion, Theme-Objekt) neben Tailwind.
- **Komponenten selbst bauen.** Verworfen: Fokusführung, Tastaturbedienung und Screenreader-Verhalten von Dialogen und Tooltips müssten von Hand nachgebaut werden.
- **shadcn/ui mit Tailwind, konsequent genutzt.** Gewählt.

## Decision
Das Frontend nutzt shadcn/ui als Komponentenbasis, mit Tailwind als einzigem Styling-Ansatz.

- Der eigene Look entsteht über die CSS-Variablen in `src/index.css`, nicht über eigenes CSS pro Komponente.
- Die Radix-Basis liefert Fokusführung, Tastatur und Screenreader-Verhalten, ohne Eigenbau.
- Die Komponenten liegen als Quelltext im Repo. Es gibt keine Laufzeit-Abhängigkeit, die sich unter uns ändert.
- Neue Komponenten kommen über die shadcn-CLI hinzu, wie es bei `button` geschah.
- Das Brett bleibt in Tailwind gebaut und ist damit kompatibel.

## Consequences
- Der Look ändert sich über Variablen. Wer eine Farbe oder einen Radius anpassen will, ändert `src/index.css`, nicht die Komponente.
- Die Quelltexte der Komponenten gehören dem Repo: Updates von shadcn/ui kommen nicht von selbst, sondern nur durch erneutes Hinzufügen und manuelles Zusammenführen.
- Ein zweites Styling-System oder eine zweite Komponentenbibliothek kommt nicht dazu. Wer eines braucht, braucht ein neues ADR.
- `implementation` steht auf `partial`: Eingebaut ist erst `button`; die übrigen Komponenten folgen mit der Umgestaltung.

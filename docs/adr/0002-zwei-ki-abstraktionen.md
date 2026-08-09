---
type: adr
status: accepted
implementation: planned
updated: 2026-08-08
supersedes: []
verifies: []
---

# ADR-0002: Zwei getrennte KI-Abstraktionen — MoveEngine und ChessCoach

## Status
Accepted

## Context
Die Anwendung braucht zwei verschiedene KI-Fähigkeiten:
1. **Zugberechnung und Stellungsbewertung** (numerisch, deterministisch): für den KI-Gegner und die Evaluation Bar.
2. **Natürlichsprachliche Erklärungen und Lernfeedback**: für den Trainingsmodus, Tutorials und den personalisierten Lernpfad.

Ein naheliegender Ansatz wäre ein einziges `ChessAI`-Interface das beides abdeckt, sodass eine Implementierung (z.B. ein LLM) alles liefert.

## Decision
Es werden zwei unabhängige, austauschbare Interfaces definiert:

- **`MoveEngine`**: berechnet legale Züge, wählt den besten Zug, liefert Centipawn-Evaluationen. Kanonische Implementierung: Stockfish (Server-Prozess, UCI-Protokoll). Wird auch für die asynchrone Post-Game-Analyse und die Extraktion von Trainingspositionen genutzt.
- **`ChessCoach`**: generiert natürlichsprachliche Erklärungen, bewertet Nutzerzüge textuell, erstellt Tutorials und Lernpfade. Kanonische Implementierung: LLM (via API).

Beide Interfaces sind unabhängig voneinander austauschbar.

## Consequences
- LLMs werden nicht für Zugberechnung missbraucht (sie halluzinieren illegale Züge).
- Stockfish kann nicht für Erklärungen genutzt werden — diese Lücke füllt ChessCoach.
- Zwei separate Integrationspunkte im Backend müssen konfiguriert und gewartet werden.
- Der Trainingsmodus kombiniert beide: MoveEngine liefert die Lösung, ChessCoach erklärt sie.
- Zukünftige Implementierungen (z.B. Leela Chess Zero als MoveEngine, anderes LLM als ChessCoach) können unabhängig eingesetzt werden.

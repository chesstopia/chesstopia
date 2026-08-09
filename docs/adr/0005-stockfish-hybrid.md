---
type: adr
status: accepted
implementation: planned
updated: 2026-08-08
supersedes: []
verifies: []
---

# ADR-0005: Stockfish Hybrid — Server-Prozess für KI-Gegner, Stockfish.js für Evaluation Bar

## Status
Accepted

## Context
Zwei Features brauchen Engine-Analyse in Echtzeit:
1. **KI-Gegner**: berechnet den nächsten Zug des KI-Spielers während einer laufenden Partie.
2. **Evaluation Bar**: zeigt in Echtzeit die Stellungsbewertung während einer Partie oder Analyse.

Beide Features könnten server-seitig oder client-seitig laufen.

## Decision
**Server-seitig (Stockfish-Prozess, UCI)**: ausschließlich für den KI-Gegner und die asynchrone Post-Game-Analyse. Der Server kontrolliert die Engine — Züge können nicht client-seitig manipuliert werden.

**Client-seitig (Stockfish.js, WebAssembly)**: ausschließlich für die Evaluation Bar im Live-Analyse- und Beobachter-Modus. Läuft im Browser-Worker-Thread, verursacht keine Server-Last.

**Post-Game-Analyse** (tiefe Analyse gespeicherter Partien): server-seitig, asynchron als Hintergrundjob.

## Consequences
- KI-Züge sind nicht manipulierbar (server-autoritär).
- Die Evaluation Bar skaliert mit der Nutzerzahl ohne Server-CPU-Last — jeder Nutzer rechnet lokal.
- Das Frontend-Bundle erhält Stockfish.js (WASM, ~5–10 MB); Lazy Loading ist erforderlich.
- Der Server braucht die Stockfish-Binary im Docker-Image (kein reines JVM-Image).
- Beide Stockfish-Instanzen müssen separat versioniert und aktuell gehalten werden.

---
type: adr
status: accepted
implementation: planned
updated: 2026-08-08
supersedes: []
verifies: []
---

# ADR-0004: Glicko-2 als Rating-System (via austauschbares RatingSystem-Interface)

## Status
Accepted

## Context
Für Matchmaking, Statistiken und Fortschritts-Tracking braucht jeder Nutzer ein Rating. Die klassische Alternative ist ELO (einfach, bekannt). Glicko-2 ist komplexer aber modelliert Unsicherheit explizit.

Das Rating-System sollte austauschbar sein (eigene Implementierungen möglich).

## Decision
Ein `RatingSystem`-Interface kapselt die Rating-Berechnung. Die kanonische Implementierung ist **Glicko-2**.

Jeder Nutzer speichert drei Werte:
- `rating` (Spielstärke, ~1500 initial)
- `rating_deviation` (Unsicherheit; hoch bei neuen Spielern, sinkt mit Partienanzahl)
- `volatility` (Konsistenz der Performance)

Diese Werte werden nach jeder gewerteten Partie über das `RatingSystem`-Interface neu berechnet.

## Consequences
- Neue Nutzer bekommen nach wenigen Partien noch kein verlässliches Rating — das ist durch `rating_deviation` explizit sichtbar und kommunizierbar, statt implizit falsch (wie bei ELO).
- Glicko-2 ist weniger intuitiv für Nutzer als ELO; die UI muss `rating_deviation` verständlich darstellen.
- Das `RatingSystem`-Interface erlaubt spätere Umstellung (z.B. eigene gewichtete Implementierung) ohne Datenbankänderungen — nur die Berechnungslogik wird ausgetauscht.
- Rating-Snapshots in der `Partie`-Tabelle ([ADR-0003](0003-move-event-log.md)) stellen sicher dass historische Statistiken korrekt bleiben auch wenn das Rating-System gewechselt wird.

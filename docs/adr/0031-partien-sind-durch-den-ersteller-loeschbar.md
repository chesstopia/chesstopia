---
type: adr
status: accepted
implementation: complete
updated: 2026-10-25
supersedes: []
verifies:
  - 'docs/api/openapi.yaml :: operationId: deleteGame'
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/game/adapter/out/websocket/GameEventsWebSocketAdapter.java :: game-deleted'
  - 'chesstopia-frontend/src/lib/stomp.ts :: game-deleted'
  - 'chesstopia-frontend/src/pages/GamePage.tsx :: Diese Partie wurde gelöscht.'
  - 'e2e/app/intern/aufraeumen.ts :: schneideAngelegtePartienMit'
---

# ADR-0031: Partien sind durch den Ersteller löschbar

## Status
Accepted

## Context
Jeder E2E-Lauf hinterließ Partien in der Datenbank: lokal rund zwanzig pro Lauf, in Produktion eine pro Deploy, weil der Deploy-Smoke dort eine Partie anlegt und einen Zug spielt. Es gab keinen Weg, eine Partie zu entfernen.

Seit [ADR-0028](0028-artefakt-kette-und-e2e-gegen-den-prod-stack.md) ist E2E ein Black-Box-Client gegen den Stack im `prod`-Profil. Aufräumen muss deshalb über einen echten, öffentlichen Weg laufen; Sonderzugänge gibt es in diesem Profil nicht.

Die Berechtigung dafür existiert bereits: Der Ersteller-Token identifiziert den Ersteller einer Partie ([ADR-0025](0025-owner-invite-token-als-partie-identitaet.md)). Das Zuglog ist ein Teil der Partie ([ADR-0003](0003-move-event-log.md)).

## Considered Options
- **Soft-Delete (Löschmarke).** Verworfen: Die Zeilen blieben in der Datenbank, das Problem wanderte nur in jede Abfrage, die die Marke beachten müsste.
- **Test-Endpunkt in einem eigenen Profil.** Verworfen: E2E läuft gegen das `prod`-Profil ([ADR-0028](0028-artefakt-kette-und-e2e-gegen-den-prod-stack.md)); ein Endpunkt, der dort fehlt, ist dort nicht benutzbar, und ein Endpunkt, der dort vorhanden ist, wäre ein Aufräumzugang in Produktion.
- **Direkter Datenbankzugriff aus `e2e/`.** Verworfen: Er bricht die Black-Box-Grenze, verlangt Zugangsdaten im Testpaket und scheitert gegen Produktion.
- **Nur lokal aufräumen.** Verworfen: Das Problem mit Produktion — eine Partie pro Deploy — bliebe bestehen.
- **Hartes Löschen durch den Ersteller über die öffentliche API.** Gewählt.

## Decision
Der Ersteller löscht eine Partie mit `DELETE /api/v1/games/{gameId}` (`deleteGame`), authentifiziert durch den Ersteller-Token im Header `X-Player-Token`.

- **204**: Partie und alle Züge sind gelöscht, hart.
- **403**: Der Token ist der Einladungs-Token oder fehlt.
- **404**: Die Partie existiert nicht.

Nach dem Commit der Löschung sendet das Backend auf `/topic/games/{gameId}` einen STOMP-Frame mit dem Header `event: game-deleted` und dem Body `{"gameId": …}`. Zug-Frames bleiben unverändert. Das Senden nach dem Commit stellt sicher, dass kein Client eine Löschung meldet, die zurückgerollt wurde.

Das Frontend bietet das Löschen auf der Startseite mit einem Warndialog an. Die Partieseite zeigt „Diese Partie wurde gelöscht.", sobald der Push eintrifft oder die Partie mit 404 antwortet, und entfernt den `localStorage`-Eintrag.

Die E2E-Zugriffsschicht schneidet im Teardown jedes Spielers jede erfolgreiche Anlage mit (`app/intern/aufraeumen.ts`) und löscht diese Partien über die API — auch bei rotem Test und im Deploy-Smoke gegen Produktion.

## Consequences
- Das Zuglog einer gelöschten Partie verschwindet mit ihr ([ADR-0003](0003-move-event-log.md)). Eine Partie ist damit nicht mehr unveränderlich archiviert; wer Partien später auswerten oder wiederholen will, muss das vor dem Löschen sichern.
- Der Ersteller-Token ([ADR-0025](0025-owner-invite-token-als-partie-identitaet.md)) ist jetzt auch die Berechtigung zum Löschen. Wer ihn hat, kann die Partie unwiderruflich entfernen; der Gegner kann es nicht.
- Jeder Client, der `/topic/games/{gameId}` abonniert, muss den Header `event` beachten. Ein Client, der jeden Frame als Zug liest, bricht bei der Löschnachricht.
- Der Deploy-Smoke hinterlässt in Produktion keine Zeilen mehr; geprüft wird die Datenbank weiterhin, weil Anlegen, Ziehen und Löschen sie durchlaufen.
- Die Löschung ist nicht umkehrbar. Es gibt keinen Papierkorb und keine Wiederherstellung.

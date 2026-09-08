---
type: adr
status: accepted
implementation: complete
updated: 2026-09-08
supersedes: []
verifies:
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/config/WebSocketConfig.java :: registry.enableSimpleBroker("/topic", "/queue")'
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/game/application/port/out/GameEvents.java :: GameEvents'
  - 'chesstopia-backend/src/main/java/io/chesstopia/backend/game/adapter/out/websocket/GameEventsWebSocketAdapter.java :: GameEventsWebSocketAdapter'
---

# ADR-0026: Bestehendes STOMP/WebSocket für den Zug-Push statt RSocket

## Status
Accepted

## Context
Der Zug-Push braucht genau ein Interaktionsmuster: Der Server schiebt die resultierende Stellung an alle, die das Topic einer Partie abonniert haben. `spring-boot-starter-websocket` und ein STOMP-`WebSocketConfig` (`enableSimpleBroker`, Endpoint `/ws`) standen bereits in der Abhängigkeit und waren konfiguriert, aber ungenutzt.

## Considered Options
- **RSocket** — verworfen. Bietet reichere Interaktionsmodelle (Request-Stream, Channel, Backpressure), die dieses Feature nicht braucht. Spring's RSocket-Unterstützung ist Reactor-basiert, was dem expliziten Projektentschluss widerspricht, Virtual Threads gerade deshalb einzusetzen, damit kein reaktiver Stack nötig ist (`docs/notes/backend-konventionen.md`). Browser sprechen zudem kein natives RSocket — `rsocket-js` liefe ohnehin RSocket-über-WebSocket und würde damit eine zweite Framing-Schicht einziehen, ohne bei dieser Größenordnung einen Transportvorteil zu bringen.

## Decision
Der Zug-Push nutzt den bestehenden, bisher ungenutzten STOMP-Broker aus `WebSocketConfig` (`/topic/games/{gameId}`) über einen neuen `GameEvents`-Out-Port, statt RSocket einzuführen.

## Consequences
- `GameEventsWebSocketAdapter` verwendet den bestehenden `WebMapper` weiter, statt einen fünften Adapter-Mapper einzuführen (CLAUDE.md Verbot 5).
- Eine künftige Authentifizierung auf dem WS-Kanal setzt an einem `ChannelInterceptor` auf dem STOMP-`CONNECT`-Frame plus `AbstractSecurityWebSocketMessageBrokerConfigurer` an — hier vermerkt, damit es nicht später als offene Frage neu entdeckt werden muss.
- Ein künftiger Bedarf an Request-Stream-, Channel- oder Backpressure-Semantik ist mit dieser Entscheidung nicht abgedeckt; er würde eine eigene, neue Entscheidung erfordern, keine Erweiterung dieser hier.

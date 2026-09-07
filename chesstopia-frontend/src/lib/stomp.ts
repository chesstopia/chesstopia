import { Client } from '@stomp/stompjs';

/**
 * Abonniert `/topic/games/{gameId}` über den bereits konfigurierten STOMP-
 * Broker (WebSocketConfig, Backend). Gibt eine Unsubscribe-Funktion zurück.
 *
 * `location.origin.replace(/^http/, 'ws')` trifft sowohl http→ws als auch
 * https→wss, weil "https" mit dem Präfix "http" beginnt.
 */
export function subscribeToGame(gameId: string, onMessage: (raw: string) => void): () => void {
  const client = new Client({
    brokerURL: `${location.origin.replace(/^http/, 'ws')}/ws`,
    onConnect: () => {
      client.subscribe(`/topic/games/${gameId}`, (message) => onMessage(message.body));
    },
  });
  client.activate();
  return () => {
    client.deactivate();
  };
}

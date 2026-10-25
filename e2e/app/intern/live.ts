import type { Page, WebSocket } from '@playwright/test';

/**
 * Wartet, bis der STOMP-Client der Seite sein Abo gesendet hat.
 *
 * Die Gegenseite erfährt von einem Zug ausschließlich über den Push auf
 * `/ws`. Zieht der Test, bevor das Abo steht, geht der Broadcast an niemanden,
 * und die Gegenseite bleibt auf der Stellung aus ihrem `getGame` stehen — der
 * Test hinge dann im Warten auf „Du bist am Zug". Der Listener muss **vor**
 * der Navigation hängen, deshalb gibt die Funktion ein Promise zurück, das
 * erst nach dem Navigieren abgewartet wird. Der Pfadfilter lässt den
 * HMR-Socket des Vite-Devservers außen vor.
 */
export function stompAbo(page: Page, farbe: string, timeout = 10_000): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onSocket: ((socket: WebSocket) => void) | undefined;

  const abo = new Promise<void>((resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${farbe}: STOMP-Client hat kein SUBSCRIBE auf /ws gesendet`)),
      timeout,
    );
    onSocket = (socket) => {
      if (new URL(socket.url()).pathname !== '/ws') return;
      socket.on('framesent', (frame) => {
        if (String(frame.payload).startsWith('SUBSCRIBE')) resolve();
      });
    };
    page.on('websocket', onSocket);
  }).finally(() => {
    clearTimeout(timer);
    if (onSocket) page.off('websocket', onSocket);
  });

  // Scheitert der Aufrufer zwischen Anlegen und `await` — fehlender Button,
  // Timeout bei waitForURL —, würde der Timer später ein Promise ohne Handler
  // verwerfen, und Playwright könnte das einem anderen Test anlasten. Der leere
  // Handler verhindert nur das; wer `await abo` erreicht, bekommt den Fehler.
  abo.catch(() => {});
  return abo;
}

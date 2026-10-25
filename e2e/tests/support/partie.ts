import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

export type Partie = { gameId: string; einladungslink: string };

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
export function stompAbo(page: Page, timeout = 10_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('STOMP-Client hat kein SUBSCRIBE auf /ws gesendet')),
      timeout,
    );
    page.on('websocket', (socket) => {
      if (new URL(socket.url()).pathname !== '/ws') return;
      socket.on('framesent', (frame) => {
        if (String(frame.payload).startsWith('SUBSCRIBE')) {
          clearTimeout(timer);
          resolve();
        }
      });
    });
  });
}

/**
 * Legt über die Startseite eine Partie an. Die Seite spielt danach Weiß.
 *
 * Seit CHESS-19 entsteht eine Partie nur noch über „Neue Partie starten"; die
 * `gameId` steht danach in der URL, der Einladungslink für Schwarz auf der
 * Seite. Zurück kommt die Funktion erst, wenn das Brett gerendert ist und
 * das STOMP-Abo steht — ohne Abo sähe Weiß die Züge von Schwarz nie.
 */
export async function neuePartie(page: Page): Promise<Partie> {
  await page.goto('/');
  const abo = stompAbo(page);
  await page.getByRole('button', { name: 'Neue Partie starten' }).click();
  await page.waitForURL(/\/game\/[0-9a-f-]+$/);
  await expect(page.locator('[data-square]')).toHaveCount(64);
  await abo;

  const gameId = new URL(page.url()).pathname.split('/').pop() as string;
  const einladungslink = (await page.getByText(/^Einladungslink:/).locator('code').textContent()) as string;
  return { gameId, einladungslink };
}

/**
 * Öffnet den Einladungslink in einem eigenen Browser-Kontext. Die Seite spielt
 * danach Schwarz.
 *
 * Der eigene Kontext ist Pflicht, nicht Hygiene: Die Rolle steht in
 * `localStorage` (`chesstopia.games`), und `useGameState` nimmt einen dort
 * vorhandenen Eintrag vor dem Token aus der URL. Im Kontext des Erstellers
 * fände es dessen Eintrag — die Seite spielte dann ebenfalls Weiß.
 */
export async function trittBei(
  browser: Browser,
  einladungslink: string,
): Promise<{ kontext: BrowserContext; page: Page }> {
  const kontext = await browser.newContext();
  const page = await kontext.newPage();
  const abo = stompAbo(page);
  await page.goto(einladungslink);
  await expect(page.locator('[data-square]')).toHaveCount(64);
  await abo;
  return { kontext, page };
}

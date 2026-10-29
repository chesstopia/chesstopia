import type { APIRequestContext, Page } from '@playwright/test';

export interface AngelegtePartien {
  /** Löscht jede mitgeschnittene Partie; 204 und 404 gelten als Erfolg. Alle Löschungen laufen, Fehler werden danach gesammelt geworfen. */
  loescheAlle(request: APIRequestContext, baseURL: string): Promise<void>;
}

interface Angelegt {
  id: string;
  ownerToken: string;
}

/**
 * Schneidet jedes erfolgreiche `POST /api/v1/games` der Seite mit. So wird
 * auch eine Partie erfasst, deren Anlegen im Test danach scheitert. Der Body
 * wird asynchron gelesen; `loescheAlle` wartet darauf.
 */
export function schneideAngelegtePartienMit(page: Page): AngelegtePartien {
  const lesevorgaenge: Array<Promise<Angelegt | null>> = [];
  const lesefehler: string[] = [];

  page.on('response', (antwort) => {
    const anfrage = antwort.request();
    if (anfrage.method() !== 'POST') return;
    if (new URL(antwort.url()).pathname !== '/api/v1/games') return;
    if (antwort.status() !== 201) return;
    lesevorgaenge.push(
      antwort.json().then(
        (body: { id: string; ownerToken: string }) => ({ id: body.id, ownerToken: body.ownerToken }),
        (grund: unknown) => {
          lesefehler.push(
            `Aufräumen: Antwort auf das Anlegen einer Partie nicht lesbar: ${grund instanceof Error ? grund.message : String(grund)}`,
          );
          return null;
        },
      ),
    );
  });

  return {
    async loescheAlle(request, baseURL) {
      const partien = (await Promise.all(lesevorgaenge)).filter((p): p is Angelegt => p !== null);
      const ergebnisse = await Promise.allSettled(
        partien.map(async ({ id, ownerToken }) => {
          const antwort = await request.delete(new URL(`/api/v1/games/${id}`, baseURL).toString(), {
            headers: { 'X-Player-Token': ownerToken },
          });
          if (antwort.status() !== 204 && antwort.status() !== 404) {
            throw new Error(`Aufräumen: Partie ${id} nicht gelöscht: ${antwort.status()}`);
          }
        }),
      );
      const fehler = [
        ...lesefehler,
        ...ergebnisse
          .filter((e): e is PromiseRejectedResult => e.status === 'rejected')
          .map((f) => (f.reason as Error).message),
      ];
      if (fehler.length > 0) {
        throw new Error(fehler.join('; '));
      }
    },
  };
}

import { expect } from '@playwright/test';

/**
 * Hängt den zuletzt gelesenen Wert an die Meldung. Mehrzeilige Werte (ein
 * Brettbild) bleiben außen vor: Dort zeigt Playwrights Diff die Abweichung
 * besser als eine Zeile.
 */
function mitSichtbar(nachricht: string, zuletzt: unknown): string {
  if (zuletzt === undefined) return nachricht;
  const text = typeof zuletzt === 'string' ? `„${zuletzt}"` : JSON.stringify(zuletzt);
  return text.includes('\n') ? nachricht : `${nachricht}, sichtbar ${text}`;
}

/** Wiederholt `lies`, bis der Wert `soll` entspricht; sonst scheitert es mit `nachricht`. */
export async function warteAufWert<T>(
  nachricht: string,
  lies: () => Promise<T>,
  soll: T,
): Promise<void> {
  let zuletzt: T | undefined;
  try {
    await expect
      .poll(async () => (zuletzt = await lies()), { message: nachricht })
      .toEqual(soll);
  } catch (fehler) {
    const original = fehler instanceof Error ? fehler.message : String(fehler);
    throw new Error(`${mitSichtbar(nachricht, zuletzt)}\n${original}`);
  }
}

/** Wiederholt `lies`, bis `bedingung` zutrifft; gibt den letzten Wert zurück. */
export async function warteBis<T>(
  nachricht: string,
  lies: () => Promise<T>,
  bedingung: (wert: T) => boolean,
): Promise<T> {
  let zuletzt: T | undefined;
  try {
    await expect
      .poll(
        async () => {
          zuletzt = await lies();
          return bedingung(zuletzt);
        },
        { message: nachricht },
      )
      .toBe(true);
  } catch {
    throw new Error(`${nachricht}; letzter Wert: ${JSON.stringify(zuletzt)}`);
  }
  return zuletzt as T;
}

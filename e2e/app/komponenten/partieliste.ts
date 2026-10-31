import type { Page } from '@playwright/test';
import type { Farbe } from '../../modell/schach';
import { warteAufWert } from '../intern/warten';

export type Listeneintrag = {
  abschnitt: 'laufend' | 'beendet';
  farbe: Farbe;
  eingeladen: boolean;
  status: string;
  zuletzt: string;
  /** Rohwert von `data-last-played` (ISO-Zeitstempel). */
  zuletztIso: string;
};

/** Die Partieliste der Startseite: eine Zeile je Partie, erkennbar an `data-game-id`. */
export class Partieliste {
  constructor(
    private readonly page: Page,
    private readonly farbe: Farbe,
  ) {}

  /** Momentaufnahme der Zeile; `null`, solange die Partie nicht gelistet ist. */
  async eintrag(id: string): Promise<Listeneintrag | null> {
    const zeile = this.page.locator(`[data-game-id="${id}"]`);
    if ((await zeile.count()) === 0) return null;
    return zeile.first().evaluate((element) => {
      const text = (selektor: string) =>
        (element.querySelector(selektor)?.textContent ?? '').trim();
      return {
        abschnitt: element.getAttribute('data-section') as 'laufend' | 'beendet',
        farbe: element.getAttribute('data-color') === 'w' ? ('weiss' as const) : ('schwarz' as const),
        eingeladen: element.getAttribute('data-invited') === 'true',
        status: text('[data-status-badge]'),
        zuletzt: text('[data-last-played]'),
        zuletztIso: element.querySelector('[data-last-played]')?.getAttribute('data-last-played') ?? '',
      };
    });
  }

  /** Wartet, bis die genannten Felder der Zeile stimmen; die übrigen bleiben außen vor. */
  async erwarteEintrag(id: string, soll: Partial<Listeneintrag>): Promise<void> {
    const schluessel = Object.keys(soll) as (keyof Listeneintrag)[];
    await warteAufWert(
      `${this.farbe}: Listeneintrag ${id} weicht ab`,
      async () => {
        const ist = await this.eintrag(id);
        if (ist === null) return null;
        return Object.fromEntries(schluessel.map((k) => [k, ist[k]]));
      },
      soll as Record<string, unknown>,
    );
  }
}

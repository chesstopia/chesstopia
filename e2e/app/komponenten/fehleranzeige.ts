import type { Page } from '@playwright/test';
import type { Farbe } from '../../modell/schach';
import { warteAufWert, warteBis } from '../intern/warten';

const VORSATZ = 'Fehler: ';

/** Der rote Absatz `Fehler: …` unter dem Brett; der Text kommt ohne den Vorsatz zurück. */
export class Fehleranzeige {
  constructor(
    private readonly page: Page,
    private readonly farbe: Farbe,
  ) {}

  async text(): Promise<string | null> {
    const absaetze = await this.page.getByText(/^Fehler:/).allTextContents();
    if (absaetze.length === 0) return null;
    const roh = absaetze[0].trim();
    return roh.startsWith(VORSATZ) ? roh.slice(VORSATZ.length) : roh;
  }

  async erwarte(soll: string | RegExp | null): Promise<void> {
    if (soll === null || typeof soll === 'string') {
      await warteAufWert(
        `${this.farbe}: Fehler erwartet ${soll === null ? 'keiner' : `„${soll}"`}`,
        () => this.text(),
        soll,
      );
      return;
    }
    await warteBis(
      `${this.farbe}: Fehler erwartet ${soll}`,
      () => this.text(),
      (text) => text !== null && soll.test(text),
    );
  }
}

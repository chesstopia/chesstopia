import type { Page } from '@playwright/test';
import type { Farbe, Zuganzeige } from '../../modell/schach';
import { warteAufWert } from '../intern/warten';

// Die Texte stehen in GamePage.tsx; hier die einzige Zuordnung zur Zuganzeige.
const TEXTE: ReadonlyArray<readonly [string, Zuganzeige]> = [
  ['Du bist am Zug', 'du-bist-am-zug'],
  ['Gegner ist am Zug', 'gegner-ist-am-zug'],
  ['Zug wird gespielt…', 'zug-wird-gespielt'],
  ['Zuschauer', 'zuschauer'],
];

/** Die Zeile unter dem Brett, die sagt, wer am Zug ist. */
export class Zugzeile {
  constructor(
    private readonly page: Page,
    private readonly farbe: Farbe,
  ) {}

  async anzeige(): Promise<Zuganzeige> {
    const absaetze = await this.page.locator('main p').allTextContents();
    for (const [text, anzeige] of TEXTE) {
      if (absaetze.some((absatz) => absatz.trim() === text)) return anzeige;
    }
    return 'keine';
  }

  async erwarteAnzeige(soll: Zuganzeige): Promise<void> {
    await warteAufWert(
      `${this.farbe}: Zuganzeige erwartet „${soll}"`,
      () => this.anzeige(),
      soll,
    );
  }
}

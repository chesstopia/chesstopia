import type { Page } from '@playwright/test';
import type { Farbe, Zuganzeige } from '../../modell/schach';
import { warteAufWert } from '../intern/warten';

/** Die Anzeige, die sagt, wer am Zug ist (`data-turn-indicator`). */
export class Zugzeile {
  constructor(
    private readonly page: Page,
    private readonly farbe: Farbe,
  ) {}

  async anzeige(): Promise<Zuganzeige> {
    const wert = await this.page.locator('[data-turn-indicator]').first().getAttribute('data-turn-indicator', { timeout: 500 }).catch(() => null);
    return (wert as Zuganzeige | null) ?? 'keine';
  }

  async erwarteAnzeige(soll: Zuganzeige): Promise<void> {
    await warteAufWert(
      `${this.farbe}: Zuganzeige erwartet „${soll}"`,
      () => this.anzeige(),
      soll,
    );
  }
}

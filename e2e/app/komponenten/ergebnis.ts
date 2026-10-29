import type { Page } from '@playwright/test';
import type { Farbe } from '../../modell/schach';
import { warteAufWert } from '../intern/warten';

/** Die Ergebniszeile einer beendeten Partie (`role="status"`). */
export class Ergebnis {
  constructor(
    private readonly page: Page,
    private readonly farbe: Farbe,
  ) {}

  async text(): Promise<string | null> {
    const treffer = this.page.getByRole('status');
    if ((await treffer.count()) === 0) return null;
    return ((await treffer.first().textContent()) ?? '').trim();
  }

  async erwarteText(soll: string | null): Promise<void> {
    await warteAufWert(
      `${this.farbe}: Ergebnis erwartet ${soll === null ? 'keines' : `„${soll}"`}`,
      () => this.text(),
      soll,
    );
  }
}

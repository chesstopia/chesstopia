import type { Page } from '@playwright/test';
import type { Farbe } from '../../modell/schach';

/** Der Block mit Einladungs- und Zuschauer-Link; nur der Ersteller sieht ihn. */
export class Einladung {
  constructor(
    private readonly page: Page,
    private readonly farbe: Farbe,
  ) {}

  async einladungslink(): Promise<string> {
    const code = this.page.getByText(/^Einladungslink:/).locator('code');
    const text = await code.textContent();
    if (text === null) throw new Error(`${this.farbe}: kein Einladungslink sichtbar`);
    return text;
  }
}

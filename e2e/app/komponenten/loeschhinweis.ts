import type { Page } from '@playwright/test';
import type { Farbe } from '../../modell/schach';

/** Der Hinweis „Diese Partie wurde gelöscht." samt Link zur Startseite (`role="alert"`). */
export class Loeschhinweis {
  constructor(
    private readonly page: Page,
    private readonly farbe: Farbe,
  ) {}

  async erwarteSichtbar(): Promise<void> {
    try {
      await this.page
        .getByRole('alert')
        .filter({ hasText: 'Diese Partie wurde gelöscht.' })
        .waitFor({ state: 'visible', timeout: 5_000 });
      await this.page.getByRole('link', { name: 'Zur Startseite' }).waitFor({ state: 'visible', timeout: 5_000 });
    } catch (fehler) {
      throw new Error(`${this.farbe}: kein Löschhinweis „Diese Partie wurde gelöscht." sichtbar: ${(fehler as Error).message}`);
    }
  }
}

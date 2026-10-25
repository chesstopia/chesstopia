import type { Page } from '@playwright/test';
import type { Farbe } from '../../modell/schach';

export class Startseite {
  constructor(
    private readonly page: Page,
    private readonly farbe: Farbe,
  ) {}

  async oeffne(): Promise<void> {
    await this.page.goto('/');
  }

  /** Klickt und wartet, bis die URL auf die neue Partie zeigt. */
  async neuePartieStarten(): Promise<void> {
    await this.page.getByRole('button', { name: 'Neue Partie starten' }).click();
    await this.page.waitForURL(/\/game\/[0-9a-f-]+$/, { timeout: 10_000 }).catch((fehler: Error) => {
      throw new Error(`${this.farbe}: URL zeigt nicht auf eine neue Partie: ${fehler.message}`);
    });
  }
}

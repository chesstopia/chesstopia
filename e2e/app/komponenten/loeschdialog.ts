import type { Page } from '@playwright/test';
import type { Farbe } from '../../modell/schach';

/** Der modale Warndialog „Partie löschen?" auf der Startseite. */
export class Loeschdialog {
  constructor(
    private readonly page: Page,
    private readonly farbe: Farbe,
  ) {}

  /** Klickt `Abbrechen` und wartet, bis der Dialog zu ist. */
  async abbrechen(): Promise<void> {
    await this.druecke('Abbrechen');
  }

  /** Klickt `Löschen` im Dialog und wartet, bis der Dialog zu ist. */
  async bestaetigen(): Promise<void> {
    await this.druecke('Löschen');
  }

  // Die Suche bleibt im Dialog, nicht auf der Startseite.
  private async druecke(knopf: string): Promise<void> {
    const dialog = this.page.getByRole('alertdialog', { name: 'Partie löschen?' });
    try {
      await dialog.getByRole('button', { name: knopf, exact: true }).click({ timeout: 5_000 });
      await dialog.waitFor({ state: 'hidden', timeout: 5_000 });
    } catch (fehler) {
      throw new Error(`${this.farbe}: Löschdialog „${knopf}" fehlgeschlagen: ${(fehler as Error).message}`);
    }
  }
}

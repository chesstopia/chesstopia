import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { Farbe } from '../../modell/schach';
import { Partieliste } from '../komponenten/partieliste';
import { Loeschdialog } from '../komponenten/loeschdialog';

export class Startseite {
  readonly loeschdialog: Loeschdialog;
  readonly partieliste: Partieliste;

  constructor(
    private readonly page: Page,
    private readonly farbe: Farbe,
  ) {
    this.loeschdialog = new Loeschdialog(page, farbe);
    this.partieliste = new Partieliste(page, farbe);
  }

  async oeffne(): Promise<void> {
    await this.page.goto('/');
  }

  /** Klickt und wartet, bis die URL auf die neue Partie zeigt. */
  async neuePartieStarten(): Promise<void> {
    await this.page.getByRole('button', { name: 'Neue Partie' }).click();
    await this.page.waitForURL(/\/game\/[0-9a-f-]+$/, { timeout: 10_000 }).catch((fehler: Error) => {
      throw new Error(`${this.farbe}: URL zeigt nicht auf eine neue Partie: ${fehler.message}`);
    });
  }

  /** Wartet, bis die Partie in der Liste „meine Partien" steht bzw. nicht mehr steht. */
  async erwartePartieGelistet(id: string, gelistet: boolean): Promise<void> {
    try {
      await expect(this.page.locator(`[data-game-id="${id}"]`)).toHaveCount(gelistet ? 1 : 0, { timeout: 5_000 });
    } catch (fehler) {
      throw new Error(
        `${this.farbe}: Partie ${id} erwartet ${gelistet ? 'gelistet' : 'nicht gelistet'}: ${(fehler as Error).message}`,
      );
    }
  }

  /** Klickt das Löschen-Symbol in der Zeile der Partie; der Dialog öffnet sich. */
  async klickeLoeschen(id: string): Promise<void> {
    await this.page
      .locator(`[data-game-id="${id}"]`)
      .getByRole('button', { name: 'Partie löschen', exact: true })
      .click({ timeout: 5_000 })
      .catch((fehler: Error) => {
        throw new Error(`${this.farbe}: Löschen-Knopf der Partie ${id} nicht klickbar: ${fehler.message}`);
      });
  }
}

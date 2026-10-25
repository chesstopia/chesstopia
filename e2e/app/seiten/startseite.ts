import type { Page } from '@playwright/test';

export class Startseite {
  constructor(private readonly page: Page) {}

  async oeffne(): Promise<void> {
    await this.page.goto('/');
  }

  /** Klickt und wartet, bis die URL auf die neue Partie zeigt. */
  async neuePartieStarten(): Promise<void> {
    await this.page.getByRole('button', { name: 'Neue Partie starten' }).click();
    await this.page.waitForURL(/\/game\/[0-9a-f-]+$/);
  }
}

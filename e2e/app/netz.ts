import type { Page } from '@playwright/test';

/** Eingriffe ins Netz, die nur die Oberfläche beantworten kann. */
export class Netz {
  constructor(private readonly page: Page) {}

  /**
   * Beantwortet jeden Zug mit 500. Nur der Zug-Endpunkt: Das Anlegen der
   * Partie muss gelingen, sonst gäbe es kein Brett, auf dem gezogen werden könnte.
   */
  async serverfehlerBeimZug(): Promise<void> {
    await this.page.route('**/api/v1/games/*/moves', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      }),
    );
  }
}

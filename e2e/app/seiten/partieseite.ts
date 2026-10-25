import type { Page } from '@playwright/test';
import type { Farbe } from '../../modell/schach';
import { Brett } from '../komponenten/brett';
import { Einladung } from '../komponenten/einladung';
import { Ergebnis } from '../komponenten/ergebnis';
import { Fehleranzeige } from '../komponenten/fehleranzeige';
import { Zugzeile } from '../komponenten/zugzeile';

export class Partieseite {
  readonly brett: Brett;
  readonly zugzeile: Zugzeile;
  readonly ergebnis: Ergebnis;
  readonly fehleranzeige: Fehleranzeige;
  readonly einladung: Einladung;

  constructor(
    private readonly page: Page,
    farbe: Farbe,
  ) {
    this.brett = new Brett(page, farbe);
    this.zugzeile = new Zugzeile(page, farbe);
    this.ergebnis = new Ergebnis(page, farbe);
    this.fehleranzeige = new Fehleranzeige(page, farbe);
    this.einladung = new Einladung(page, farbe);
  }

  async oeffne(url: string): Promise<void> {
    await this.page.goto(url);
  }

  /** Letztes Pfadsegment der aktuellen URL. */
  partieId(): string {
    return new URL(this.page.url()).pathname.split('/').pop() as string;
  }
}

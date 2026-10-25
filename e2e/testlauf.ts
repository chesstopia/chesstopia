/**
 * Die einzige Stelle ausserhalb von `app/`, die Playwright kennt. Tests
 * importieren `gruppe`, `pruefung` und `expect` von hier und nie aus
 * `@playwright/test` — so bleibt der Testlaeufer austauschbar, und die
 * Testebenen sehen nur deutsche Begriffe.
 */
import { test, expect } from '@playwright/test';
import { erzeugeSpieler, type Spieler } from './app/spieler';
import type { Farbe } from './modell/schach';

export function gruppe(name: string, inhalt: () => void): void {
  test.describe(name, inhalt);
}

/** Ein Test ohne Fixtures: kein Browser, kein Stack. */
export function pruefung(name: string, ablauf: () => void | Promise<void>): void {
  test(name, async () => {
    await ablauf();
  });
}

export type Werkzeuge = { neuerSpieler: (farbe: Farbe) => Promise<Spieler> };

// Jeder Spieler bekommt einen eigenen Browser-Kontext (die Rolle steht im
// localStorage). Geschlossen wird nach `use`, damit es auch bei rotem Test
// geschieht.
const szenarioTest = test.extend<Werkzeuge>({
  neuerSpieler: async ({ browser, baseURL }, use) => {
    const schliessfunktionen: Array<() => Promise<void>> = [];
    await use(async (farbe) => {
      const { spieler, schliessen } = await erzeugeSpieler(browser, farbe, baseURL);
      schliessfunktionen.push(schliessen);
      return spieler;
    });
    for (const schliessen of schliessfunktionen) await schliessen();
  },
});

/** Ein Test mit Spielern: Browser und Stack kommen von aussen. */
export function szenario(
  name: string,
  ablauf: (werkzeuge: Werkzeuge) => Promise<void>,
): void {
  szenarioTest(name, ({ neuerSpieler }) => ablauf({ neuerSpieler }));
}

// Nur die Werte: kein Playwright-Typ gelangt so in die Testebenen.
export { expect };

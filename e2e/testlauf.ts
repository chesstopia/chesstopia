/**
 * Die einzige Stelle ausserhalb von `app/` und der Konfiguration
 * (`playwright.config.ts`), die Playwright kennt. Tests
 * importieren `gruppe`, `pruefung` und `expect` von hier und nie aus
 * `@playwright/test` — so bleibt der Testlaeufer austauschbar, und die
 * Testebenen sehen nur deutsche Begriffe.
 */
import { test, expect } from '@playwright/test';
import { erzeugeSpieler, type Spieler } from './app/spieler';
import type { Farbe } from './modell/schach';

// Playwrights eigene Funktionen, nur enger typisiert: Sie werden direkt aus der
// Spec gerufen, deshalb melden Reporter und Zeilenfilter (`datei.spec.ts:27`)
// die Spec als Ort und nicht diese Datei.
export const gruppe: (name: string, inhalt: () => void) => void = test.describe;

/** Ein Test ohne Fixtures: kein Browser, kein Stack. */
export const pruefung: (name: string, ablauf: () => void | Promise<void>) => void = test;

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
    // Alle schliessen, auch wenn eines scheitert; erst danach den ersten Fehler werfen.
    const ergebnisse = await Promise.allSettled(schliessfunktionen.map((schliessen) => schliessen()));
    const gescheitert = ergebnisse.find((e) => e.status === 'rejected');
    if (gescheitert) throw gescheitert.reason;
  },
});

/**
 * Ein Test mit Spielern: Browser und Stack kommen von aussen.
 *
 * Playwright ruft den Callback der Spec selbst auf und liest die benoetigten
 * Fixtures aus seiner Parameterliste. Der Callback muss `neuerSpieler`
 * deshalb destrukturieren: `async ({ neuerSpieler }) => …`. Ein unbenannter
 * Parameter (`(werkzeuge) => …`) scheitert in Playwright.
 */
export const szenario: (
  name: string,
  ablauf: (werkzeuge: Werkzeuge) => Promise<void>,
) => void = szenarioTest;

// Nur die Werte: kein Playwright-Typ gelangt so in die Testebenen.
export { expect };

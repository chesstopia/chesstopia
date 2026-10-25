/**
 * Die einzige Stelle ausserhalb von `app/`, die Playwright kennt. Tests
 * importieren `gruppe`, `pruefung` und `expect` von hier und nie aus
 * `@playwright/test` — so bleibt der Testlaeufer austauschbar, und die
 * Testebenen sehen nur deutsche Begriffe.
 */
import { test, expect } from '@playwright/test';

export function gruppe(name: string, inhalt: () => void): void {
  test.describe(name, inhalt);
}

/** Ein Test ohne Fixtures: kein Browser, kein Stack. */
export function pruefung(name: string, ablauf: () => void | Promise<void>): void {
  test(name, async () => {
    await ablauf();
  });
}

// Nur die Werte: kein Playwright-Typ gelangt so in die Testebenen.
export { expect };

import { test, expect } from '@playwright/test';
import { dragPiece } from './support/drag';

/**
 * Der Fehlerpfad, den nur die Oberfläche hat: Das Backend antwortet auf einen
 * Zug mit 5xx, `useBoardState` fängt den Axios-Fehler und `App.tsx` rendert
 * ihn als `Fehler:`-Absatz. Auf Ebene 3 ist dieser Ast unerreichbar — dort
 * gibt es keinen Axios-Client und keinen Absatz.
 *
 * Nur der Zug-Endpunkt wird abgefangen; das Anlegen der Partie muss gelingen,
 * sonst gibt es kein Brett, auf dem gezogen werden könnte.
 */
test.describe('Netzfehler', () => {
  test('ein Serverfehler beim Zug erscheint als Fehlermeldung und lässt das Brett stehen', async ({
    page,
  }) => {
    // ARRANGE
    await page.route('**/api/v1/games/*/moves', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/problem+json',
        body: JSON.stringify({ title: 'Internal Server Error', status: 500 }),
      }),
    );
    await page.goto('/');
    await expect(page.locator('[data-square="e2"] [data-piece="wP"]')).toBeVisible();

    // ACT
    await dragPiece(page, 'e2', 'e4');

    // ASSERTIONS
    await expect(page.getByText(/^Fehler:/)).toBeVisible();
    await expect(page.locator('[data-square="e2"] [data-piece="wP"]')).toBeVisible();
    await expect(page.locator('[data-square="e4"] [data-piece]')).toHaveCount(0);
    await expect(page.getByText('Weiß am Zug')).toBeVisible();
  });
});

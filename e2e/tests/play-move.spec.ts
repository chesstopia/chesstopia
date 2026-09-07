import { test, expect } from '@playwright/test';
import { dragPiece } from './support/drag';

test.describe('Zug spielen', () => {
  test('ein legaler Zug bewegt die Figur und gibt den Zug an Schwarz weiter', async ({ page }) => {
    // ARRANGE
    await page.goto('/');
    await expect(page.locator('[data-square="e1"] [data-piece="wK"]')).toBeVisible();
    await expect(page.getByText('Weiß am Zug')).toBeVisible();

    // ACT
    await dragPiece(page, 'e2', 'e4');

    // ASSERTIONS
    await expect(page.locator('[data-square="e4"] [data-piece="wP"]')).toBeVisible();
    await expect(page.locator('[data-square="e2"] [data-piece]')).toHaveCount(0);
    await expect(page.getByText('Schwarz am Zug')).toBeVisible();
  });

  test('eine Figur der nicht ziehenden Seite lässt sich nicht aufnehmen', async ({ page }) => {
    // ARRANGE — Weiß ist am Zug, e7 gehört Schwarz.
    await page.goto('/');
    await expect(page.getByText('Weiß am Zug')).toBeVisible();

    // ACT
    await dragPiece(page, 'e7', 'e5');

    // ASSERTIONS — Square.tsx verweigert das Aufnehmen bereits am
    // onPointerDown (draggable=false), der Zug erreicht das Backend nie.
    await expect(page.locator('[data-square="e7"] [data-piece="bP"]')).toBeVisible();
    await expect(page.getByText('Weiß am Zug')).toBeVisible();
  });
});

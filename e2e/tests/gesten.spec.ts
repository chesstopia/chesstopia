import { test, expect } from '@playwright/test';
import { dragPiece } from './support/drag';
import { neuePartie } from './support/partie';

/**
 * Zeigergesten, die keine Schachsituation sind und deshalb nicht in den Korpus
 * gehören. Die Entsprechung auf Ebene 2 (`Chessboard.test.tsx`) fährt
 * synthetische Events in jsdom — dass die Verweigerung auch eine echte
 * Pointer-Geste im Browser überlebt, prüft ausschließlich dieser Test.
 */
test.describe('Gesten', () => {
  test('eine Figur der nicht ziehenden Seite lässt sich nicht aufnehmen', async ({ page }) => {
    // ARRANGE — die Seite spielt Weiß und ist am Zug, e7 gehört Schwarz.
    await neuePartie(page);
    await expect(page.getByText('Du bist am Zug')).toBeVisible();

    // ACT
    await dragPiece(page, 'e7', 'e5');

    // ASSERTIONS — Square.tsx verweigert das Aufnehmen bereits am
    // onPointerDown (draggable=false), der Zug erreicht das Backend nie.
    await expect(page.locator('[data-square="e7"] [data-piece="bP"]')).toBeVisible();
    await expect(page.getByText('Du bist am Zug')).toBeVisible();
  });
});

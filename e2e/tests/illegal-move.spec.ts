import { test, expect } from '@playwright/test';
import { dragPiece } from './support/drag';

test.describe('Illegaler Zug', () => {
  test('ein Zug, der die Gangart verletzt, wird clientseitig abgelehnt', async ({ page }) => {
    // ARRANGE — ein Bauer darf aus der Grundreihe höchstens zwei Felder.
    await page.goto('/');
    await expect(page.locator('[data-square="e2"] [data-piece="wP"]')).toBeVisible();

    // ACT
    await dragPiece(page, 'e2', 'e5');

    // ASSERTIONS — useBoardState prüft über die im Browser laufende Engine
    // (src/lib/engine.ts, isLegalMove) vor jedem Request; das Backend wird
    // für diesen Zug nie kontaktiert, die Stellung bleibt unverändert.
    await expect(page.getByText('Fehler: Dieser Zug ist nicht legal.')).toBeVisible();
    await expect(page.locator('[data-square="e2"] [data-piece="wP"]')).toBeVisible();
    await expect(page.locator('[data-square="e5"] [data-piece]')).toHaveCount(0);
    await expect(page.getByText('Weiß am Zug')).toBeVisible();
  });
});

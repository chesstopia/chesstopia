import { test, expect } from '@playwright/test';
import { dragPiece } from './support/drag';

test.describe('Partieende', () => {
  test('Schachmatt zeigt das Ergebnisbanner und sperrt das Brett', async ({ page }) => {
    // ARRANGE
    await page.goto('/');

    // ACT — Narrenmatt: 1. f3 e5 2. g4 Qh4#
    await dragPiece(page, 'f2', 'f3');
    await expect(page.getByText('Schwarz am Zug')).toBeVisible();

    await dragPiece(page, 'e7', 'e5');
    await expect(page.getByText('Weiß am Zug')).toBeVisible();

    await dragPiece(page, 'g2', 'g4');
    await expect(page.getByText('Schwarz am Zug')).toBeVisible();

    await dragPiece(page, 'd8', 'h4');

    // ASSERTIONS
    await expect(page.getByRole('status')).toHaveText('Schachmatt — Schwarz gewinnt');
    await expect(page.getByText(/am Zug$/)).toHaveCount(0);

    // Das Brett ist gesperrt. Bewusst d2→d4: ein regulärer Zug der am Zug
    // befindlichen Seite, der ohne Sperre die Zuglogik erreichen würde. Der
    // aussagekräftige Teil ist die ausbleibende Fehlermeldung — käme der Zug
    // durch, lehnte ihn die Engine mit "Dieser Zug ist nicht legal." ab.
    //
    // Die Sperre ist doppelt ausgelegt (App.tsx `disabled={pending || over}`
    // und useBoardState `if (status !== 'ONGOING') return`). Gegenprobe:
    // Entfernt man nur eine der beiden, bleibt dieser Test grün; erst wenn
    // beide fallen, erscheint die Meldung und der Test schlägt fehl. Er sichert
    // also das Verhalten, nicht eine bestimmte der beiden Sperren.
    await dragPiece(page, 'd2', 'd4');
    await expect(page.locator('[data-square="d2"] [data-piece="wP"]')).toBeVisible();
    await expect(page.locator('[data-square="d4"] [data-piece]')).toHaveCount(0);
    await expect(page.getByText(/^Fehler:/)).toHaveCount(0);
  });
});

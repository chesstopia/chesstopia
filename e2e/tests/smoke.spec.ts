import { test, expect } from '@playwright/test';
import { dragPiece } from './support/drag';
import { neuePartie } from './support/partie';

/**
 * Die Teilmenge aus ADR-0019, die nach jedem Deploy läuft: Anwendung lädt,
 * Brett rendert, Backend antwortet, Datenbank hält den Zustand. Unter einer
 * Minute, keine Abhängigkeit von den funktionalen Specs.
 */
test.describe('Smoke', () => {
  test('Anwendung lädt, Brett rendert, Backend antwortet, Datenbank hält den Zustand', async ({
    page,
  }) => {
    // ACT — die Partie entsteht über die Startseite; neuePartie
    // kehrt erst zurück, wenn das Brett mit 64 Feldern steht.
    await neuePartie(page);

    // ASSERTIONS — Backend antwortet (Startstellung: weißer König auf e1)
    await expect(page.locator('[data-square="e1"] [data-piece="wK"]')).toBeVisible();

    // ASSERTIONS — Anwendung lädt fehlerfrei. Diese Prüfung steht bewusst
    // NACH der obigen: unmittelbar nach dem Anlegen wäre sie ein No-Op,
    // weil ein Fehlerabsatz erst nach einer gescheiterten Antwort erscheint.
    await expect(page.getByText(/^Fehler:/)).toHaveCount(0);

    // ACT — ein Zug, dann ein Reload
    await dragPiece(page, 'e2', 'e4');
    await expect(page.getByText('Gegner ist am Zug')).toBeVisible();
    await page.reload();

    // ASSERTIONS — Datenbank hält den Zustand. Seit CHESS-19 lädt die Seite
    // die Partie über die gameId in der URL; was nach dem Reload steht, kam
    // aus der Datenbank.
    await expect(page.locator('[data-square="e4"] [data-piece="wP"]')).toBeVisible();
    await expect(page.locator('[data-square="e2"] [data-piece]')).toHaveCount(0);
  });
});

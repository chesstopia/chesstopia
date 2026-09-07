import { test, expect } from '@playwright/test';
import { dragPiece } from './support/drag';

/**
 * Die Teilmenge aus ADR-0019, die nach jedem Deploy läuft: Anwendung lädt,
 * Brett rendert, Backend antwortet, Datenbank hält den Zustand. Unter einer
 * Minute, keine Abhängigkeit von den funktionalen Specs.
 */
test.describe('Smoke', () => {
  test('Anwendung lädt, Brett rendert, Backend antwortet, Datenbank hält den Zustand', async ({
    page,
    request,
  }) => {
    // ARRANGE — die Partie entsteht beim Laden; ihre ID kommt nur aus der
    // Netzwerkantwort, useBoardState legt sie nicht sichtbar ab (siehe
    // docs/notes/e2e-aufbau.md).
    const createGame = page.waitForResponse(
      (res) => res.request().method() === 'POST' && res.url().endsWith('/api/v1/games'),
    );

    // ACT
    await page.goto('/');
    const created = await createGame;
    const { id: gameId } = await created.json();

    // ASSERTIONS — Brett rendert
    await expect(page.locator('[data-square]')).toHaveCount(64);

    // ASSERTIONS — Backend antwortet (Startstellung: weißer König auf e1)
    await expect(page.locator('[data-square="e1"] [data-piece="wK"]')).toBeVisible();

    // ASSERTIONS — Anwendung lädt fehlerfrei. Diese Prüfung steht bewusst
    // NACH den beiden obigen: unmittelbar nach `goto` wäre sie ein No-Op,
    // weil ein Fehlerabsatz erst nach einer gescheiterten Antwort erscheint.
    await expect(page.getByText(/^Fehler:/)).toHaveCount(0);

    // ACT — ein Zug, um die Persistenz über die API zu prüfen
    await dragPiece(page, 'e2', 'e4');
    await expect(page.locator('[data-square="e4"] [data-piece="wP"]')).toBeVisible();

    // ASSERTIONS — Datenbank hält den Zustand. Ein Reload zeigt immer die
    // Startstellung (useBoardState legt bei jedem Mount eine neue Partie
    // an) — die Persistenz wird deshalb über den Kontrakt geprüft, nicht
    // über die Oberfläche.
    const after = await request.get(`/api/v1/games/${gameId}`);
    expect(after.ok()).toBe(true);
    const body = await after.json();
    const onE4 = body.position.board.find(
      (p: { square: { file: string; rank: string } }) =>
        p.square.file === 'E' && p.square.rank === 'FOUR',
    );
    expect(onE4?.piece).toEqual({ type: 'PAWN', color: 'WHITE' });
  });
});

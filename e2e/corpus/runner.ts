import { expect, type Page } from '@playwright/test';
import { dragPiece } from '../tests/support/drag';
import { emptyBoard, renderBoard, type BoardMap, type PieceCode } from './board';
import type { CorpusCase } from './parser';

/**
 * Liest das gerenderte Brett in einer Netzwerkrunde statt in 64.
 *
 * 64 einzelne Locator-Abfragen je Fall wären eine spürbare Laufzeit für eine
 * Prüfung, die eine einzige Auswertung im Browser leisten kann — und die
 * Fehlermeldung wäre ein Objektdump statt eines Zeilendiffs.
 */
export async function readBoard(page: Page): Promise<BoardMap> {
  const felder = await page
    .locator('[data-square]')
    .evaluateAll((elemente) =>
      elemente.map((element) => [
        element.getAttribute('data-square'),
        element.querySelector('[data-piece]')?.getAttribute('data-piece') ?? null,
      ]),
    );

  const board = emptyBoard();
  for (const [feld, figur] of felder as Array<[string | null, string | null]>) {
    if (feld !== null) board[feld] = figur as PieceCode | null;
  }
  return board;
}

/**
 * Spielt einen Korpusfall von der Startstellung durch und prüft ihn.
 *
 * Zwischen den Halbzügen wartet der Läufer darauf, dass das **Ausgangsfeld
 * leer** ist. Das ist das eine Signal, das für jeden legalen Zug gilt — auch
 * für Schlagzüge, bei denen das Zielfeld schon vorher besetzt war. Nach dem
 * letzten Halbzug wartet nichts: dort warten die Zusicherungen selbst, weil
 * `expect` wiederholt. Genau deshalb trägt dieselbe Mechanik auch einen Fall,
 * dessen letzter Zug abgelehnt wird und dessen Ausgangsfeld besetzt bleibt.
 */
export async function runCase(page: Page, testCase: CorpusCase): Promise<void> {
  // ARRANGE
  await page.goto('/');
  await expect(page.locator('[data-square]')).toHaveCount(64);

  // ACT
  for (const [index, zug] of testCase.moves.entries()) {
    await dragPiece(page, zug.from, zug.to);
    if (index < testCase.moves.length - 1) {
      await expect(page.locator(`[data-square="${zug.from}"] [data-piece]`)).toHaveCount(0);
    }
  }

  // ASSERTIONS
  const erwartet = renderBoard(testCase.board);
  await expect
    .poll(async () => renderBoard(await readBoard(page)), { message: 'Brett nach der Zugfolge' })
    .toBe(erwartet);

  if (testCase.turn !== null) {
    const zeile = testCase.turn === 'white' ? 'Weiß am Zug' : 'Schwarz am Zug';
    await expect(page.getByText(zeile)).toBeVisible();
  } else {
    await expect(page.getByRole('status')).toHaveText(testCase.banner as string);
    await expect(page.getByText(/am Zug$/)).toHaveCount(0);
  }

  if (testCase.error !== null) {
    await expect(page.getByText(`Fehler: ${testCase.error}`)).toBeVisible();
  } else {
    await expect(page.getByText(/^Fehler:/)).toHaveCount(0);
  }

  if (testCase.locked !== null) {
    await dragPiece(page, testCase.locked.from, testCase.locked.to);
    await expect
      .poll(async () => renderBoard(await readBoard(page)), { message: 'Brett nach der Sperrgeste' })
      .toBe(erwartet);
    await expect(page.getByText(/^Fehler:/)).toHaveCount(0);
  }
}

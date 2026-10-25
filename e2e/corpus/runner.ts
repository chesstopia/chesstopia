import { expect, type Browser, type Page } from '@playwright/test';
import { dragPiece } from '../tests/support/drag';
import { neuePartie, trittBei } from '../tests/support/partie';
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

/** Die Zeile unter dem Brett, aus Sicht der jeweiligen Seite. */
function zugzeile(seite: 'white' | 'black', amZug: 'white' | 'black'): string {
  return seite === amZug ? 'Du bist am Zug' : 'Gegner ist am Zug';
}

/**
 * Spielt einen Korpusfall von der Startstellung durch und prüft ihn.
 *
 * Seit CHESS-19 spielt jede Seite in ihrem eigenen Browser-Kontext: Weiß legt
 * die Partie an, Schwarz kommt über den Einladungslink. Halbzug `i` gehört
 * Weiß bei geradem, Schwarz bei ungeradem Index — jeder Fall beginnt in der
 * Startstellung. Daraus folgt dieselbe Einschränkung wie zuvor: Abgelehnt
 * werden darf nur der letzte Halbzug, denn ein abgelehnter Zug gibt das
 * Zugrecht nicht weiter.
 *
 * Zwischen den Halbzügen wartet der Läufer, bis die Seite des **nächsten**
 * Ziehenden „Du bist am Zug" zeigt. Das ist das eine Signal, das alles
 * zugleich belegt: Die Stellung ist über den WS-Push dort angekommen, und die
 * Seite ist nicht mehr gesperrt. Nach dem letzten Halbzug wartet nichts: dort
 * warten die Zusicherungen selbst, weil `expect` wiederholt.
 */
export async function runCase(page: Page, browser: Browser, testCase: CorpusCase): Promise<void> {
  // ARRANGE
  const { einladungslink } = await neuePartie(page);
  const schwarz = await trittBei(browser, einladungslink);
  const seiten = { white: page, black: schwarz.page };
  const seiteVon = (index: number) => (index % 2 === 0 ? 'white' : 'black');

  try {
    // ACT
    for (const [index, zug] of testCase.moves.entries()) {
      await dragPiece(seiten[seiteVon(index)], zug.from, zug.to);
      if (index < testCase.moves.length - 1) {
        await expect(seiten[seiteVon(index + 1)].getByText('Du bist am Zug')).toBeVisible();
      }
    }

    // ASSERTIONS — beide Seiten zeigen dieselbe Partie
    const erwartet = renderBoard(testCase.board);
    for (const [seite, seitenPage] of Object.entries(seiten)) {
      await expect
        .poll(async () => renderBoard(await readBoard(seitenPage)), {
          message: `Brett nach der Zugfolge (${seite})`,
        })
        .toBe(erwartet);
    }

    for (const [seite, seitenPage] of Object.entries(seiten) as Array<['white' | 'black', Page]>) {
      if (testCase.turn !== null) {
        await expect(seitenPage.getByText(zugzeile(seite, testCase.turn))).toBeVisible();
      } else {
        await expect(seitenPage.getByRole('status')).toHaveText(testCase.banner as string);
        await expect(seitenPage.getByText(/am Zug$/)).toHaveCount(0);
      }
    }

    // Die Fehlermeldung erscheint nur bei der Seite, die den Zug versucht hat.
    const letzterZiehender = seiteVon(testCase.moves.length - 1);
    for (const [seite, seitenPage] of Object.entries(seiten)) {
      if (testCase.error !== null && seite === letzterZiehender) {
        await expect(seitenPage.getByText(`Fehler: ${testCase.error}`)).toBeVisible();
      } else {
        await expect(seitenPage.getByText(/^Fehler:/)).toHaveCount(0);
      }
    }

    // Die Sperrgeste macht die Seite, die ohne Partieende jetzt am Zug wäre.
    // Bei der anderen Seite wäre die Prüfung wertlos: Die ist schon durch das
    // fehlende Zugrecht gesperrt und bliebe es auch ohne Partieende.
    if (testCase.locked !== null) {
      const naechste = seiten[seiteVon(testCase.moves.length)];
      await dragPiece(naechste, testCase.locked.from, testCase.locked.to);
      await expect
        .poll(async () => renderBoard(await readBoard(naechste)), { message: 'Brett nach der Sperrgeste' })
        .toBe(erwartet);
      await expect(naechste.getByText(/^Fehler:/)).toHaveCount(0);
    }
  } finally {
    await schwarz.kontext.close();
  }
}

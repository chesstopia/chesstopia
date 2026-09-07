import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { parseBoardRows } from '../board';

/**
 * Das Format des E2E-Korpus behauptet, eine echte Teilmenge der
 * Engine-Grammatik zu sein (ADR-0022). Dieser Test hält die Behauptung an der
 * Stelle fest, an der sie steht: Er liest die Reihenzeilen einer echten
 * `.case`-Datei der Engine mit dem TypeScript-Brettleser.
 *
 * Bewusst die einbrettige Datei — die zweispaltigen INITIAL/EXPECTED-Dateien
 * sind nicht Teil der Teilmenge. Ändert die Engine Trennzeichen, Reihenfolge
 * oder Figurensymbole, wird dieser Test rot.
 */
const ENGINE_CASE = fileURLToPath(
  new URL('../../../chess-engine/testcases/illegal/bishop-off-diagonal.case', import.meta.url),
);

test.describe('drift', () => {
  test('der Brettleser liest den Brettblock einer Engine-Testcase', () => {
    // ARRANGE
    const reihen = readFileSync(ENGINE_CASE, 'utf8')
      .split('\n')
      .filter((zeile) => /^\s*[1-8]\s/.test(zeile));

    // ACT
    const board = parseBoardRows(reihen);

    // ASSERTIONS
    expect(reihen).toHaveLength(8);
    expect(board.c1).toBe('wB');
    expect(board.f1).toBe('wK');
    expect(board.a8).toBe('bK');
    expect(Object.values(board).filter((piece) => piece !== null)).toHaveLength(3);
  });
});

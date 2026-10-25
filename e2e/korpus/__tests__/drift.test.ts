import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { liesReihen } from '../../modell/brettbild';
import { figur } from '../../modell/schach';
import { gruppe, pruefung, expect } from '../../testlauf';

/**
 * Das Format des E2E-Korpus behauptet, eine echte Teilmenge der
 * Engine-Grammatik zu sein (ADR-0022). Dieser Test hält die Behauptung an der
 * Stelle fest, an der sie steht: Er liest die Reihenzeilen einer echten
 * `.case`-Datei der Engine mit dem TypeScript-Brettleser (`modell/brettbild.ts`).
 *
 * Bewusst die einbrettige Datei — die zweispaltigen INITIAL/EXPECTED-Dateien
 * sind nicht Teil der Teilmenge. Ändert die Engine Trennzeichen, Reihenfolge
 * oder Figurensymbole, wird dieser Test rot.
 */
const ENGINE_CASE = fileURLToPath(
  new URL('../../../chess-engine/testcases/illegal/bishop-off-diagonal.case', import.meta.url),
);

gruppe('drift', () => {
  pruefung('der Brettleser liest den Brettblock einer Engine-Testcase', () => {
    // ARRANGE
    const reihen = readFileSync(ENGINE_CASE, 'utf8')
      .split('\n')
      .filter((zeile) => /^\s*[1-8]\s/.test(zeile));

    // ACT
    const stellung = liesReihen(reihen);

    // ASSERTIONS
    expect(reihen).toHaveLength(8);
    expect(stellung.c1).toEqual(figur('weiss', 'laeufer'));
    expect(stellung.f1).toEqual(figur('weiss', 'koenig'));
    expect(stellung.a8).toEqual(figur('schwarz', 'koenig'));
    expect(Object.values(stellung).filter((f) => f !== null)).toHaveLength(3);
  });
});

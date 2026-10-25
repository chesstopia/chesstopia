import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gruppe, pruefung, expect } from '../../testlauf';

/**
 * Playwright darf nur in `app/` und in `testlauf.ts` importiert werden; alle
 * anderen Schichten (Specs, Korpus, Modell) sprechen ausschließlich über die
 * Schnittstelle von `app/`. Dieser Test hält die Grenze fest, damit sie nicht
 * unbemerkt aufweicht. Auch `import type` zählt, weil es dieselbe
 * `from`-Zeile hat.
 */
const WURZEL = fileURLToPath(new URL('../../', import.meta.url));
const GEPRUEFT = ['tests', 'korpus', 'modell'];
// `from '…'`, `import('…')` und der Nebenwirkungs-Import `import '…'` ohne `from`.
const IMPORT = /from\s+['"]@playwright\/test['"]|import\s*\(?\s*['"]@playwright\/test['"]/;

function dateien(ordner: string): string[] {
  return readdirSync(ordner, { withFileTypes: true }).flatMap((eintrag) => {
    const pfad = `${ordner}/${eintrag.name}`;
    if (eintrag.isDirectory()) return eintrag.name === 'node_modules' ? [] : dateien(pfad);
    return pfad.endsWith('.ts') ? [pfad] : [];
  });
}

gruppe('grenze', () => {
  pruefung('nur app/ und testlauf.ts importieren Playwright', () => {
    // ARRANGE
    const alle = GEPRUEFT.flatMap((name) => dateien(`${WURZEL}${name}`));

    // ACT
    const treffer = alle.flatMap((pfad) =>
      readFileSync(pfad, 'utf8')
        .split('\n')
        .flatMap((zeile, index) =>
          IMPORT.test(zeile) ? [`${pfad.slice(WURZEL.length)}:${index + 1}`] : [],
        ),
    );

    // ASSERTIONS
    expect(treffer).toEqual([]);
  });
});

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gruppe, pruefung, expect } from '../../testlauf';

/**
 * Playwright darf nur in `app/`, `testlauf.ts` und `playwright.config.ts`
 * importiert werden; alle anderen Schichten (Specs, Korpus, Modell) sprechen
 * ausschließlich über die Schnittstelle von `app/`. Der Test ist eine
 * Erlaubnisliste: Er scannt ganz `e2e/` und nimmt nur die genannten Ausnahmen
 * aus, damit auch neue Ordner und Wurzeldateien erfasst sind. Auch
 * `import type` zählt, weil es dieselbe `from`-Zeile hat.
 */
const WURZEL = fileURLToPath(new URL('../../', import.meta.url));
const AUSGENOMMEN = new Set([
  'app',
  'testlauf.ts',
  'playwright.config.ts',
  'node_modules',
  'test-results',
  'playwright-report',
]);
const ENDUNG = /\.(ts|tsx|mts)$/;
// `from '…'`, `import('…')` und der Nebenwirkungs-Import `import '…'` ohne `from`.
const IMPORT = /from\s+['"]@playwright\/test['"]|import\s*\(?\s*['"]@playwright\/test['"]/;

// Ausnahmen gelten nur auf oberster Ebene (relativ zu `e2e/`).
function dateien(ordner: string, oben: boolean): string[] {
  return readdirSync(ordner, { withFileTypes: true }).flatMap((eintrag) => {
    if (oben && AUSGENOMMEN.has(eintrag.name)) return [];
    const pfad = `${ordner}/${eintrag.name}`;
    if (eintrag.isDirectory()) return eintrag.name === 'node_modules' ? [] : dateien(pfad, false);
    return ENDUNG.test(pfad) ? [pfad] : [];
  });
}

gruppe('grenze', () => {
  pruefung('nur app/, testlauf.ts und die Konfiguration importieren Playwright', () => {
    // ARRANGE
    const alle = dateien(WURZEL.replace(/\/$/, ''), true);

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

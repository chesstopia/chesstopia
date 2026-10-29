import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCase } from '../korpus/parser';
import { runCase } from '../korpus/runner';
import { gruppe, szenario } from '../testlauf';

/**
 * Der datei-getriebene Korpus für Ebene 4 — eine Reportzeile je Datei, wie in
 * `chess-engine/testcases/` (ADR-0022). Anders als dort **kein Codegen**: Der
 * Grund für den Codegen der Engine ist, dass `commonTest` in KMP weder
 * Laufzeit-Dateizugriff noch parametrisierte Tests hat. Node hat beides. Eine
 * neue Datei hinlegen genügt; es gibt keinen Sync-Schritt, der vergessen
 * werden kann.
 */
const KORPUS = fileURLToPath(new URL('../testcases', import.meta.url));

function dateien(verzeichnis: string): string[] {
  return readdirSync(verzeichnis, { withFileTypes: true }).flatMap((eintrag) => {
    const voll = join(verzeichnis, eintrag.name);
    if (eintrag.isDirectory()) return dateien(voll);
    return eintrag.name.endsWith('.case') ? [voll] : [];
  });
}

gruppe('Korpus', () => {
  for (const datei of dateien(KORPUS).sort()) {
    const name = relative(KORPUS, datei).split(sep).join('/');
    const fall = parseCase(readFileSync(datei, 'utf8'), name);

    szenario(`${name} — ${fall.description}`, ({ neuerSpieler }) => runCase(neuerSpieler, fall));
  }
});

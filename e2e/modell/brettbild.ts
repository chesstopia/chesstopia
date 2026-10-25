/**
 * Das ASCII-Brett als Text — dieselbe Darstellung wie in
 * `chess-engine/testcases/` und `corpus/board.ts`, bewusst als echte
 * Teilmenge: ein Brett, keine Metazeile. Grossbuchstabe = Weiß,
 * Kleinbuchstabe = Schwarz, `.` = leeres Feld.
 */
import { figur, leereStellung, type Feld, type Figur, type Stellung } from './schach';
import type { Figurart } from './schach';

const LINIEN = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const REIHEN = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

// Die einzige Stelle der Zuordnung Symbol <-> Figur.
const SYMBOLE: ReadonlyArray<readonly [string, Figur]> = (
  [
    ['K', 'koenig'], ['Q', 'dame'], ['R', 'turm'],
    ['B', 'laeufer'], ['N', 'springer'], ['P', 'bauer'],
  ] as ReadonlyArray<readonly [string, Figurart]>
).flatMap(([symbol, art]) => [
  [symbol, figur('weiss', art)] as const,
  [symbol.toLowerCase(), figur('schwarz', art)] as const,
]);

export function figurVon(symbol: string): Figur | null {
  const treffer = SYMBOLE.find(([s]) => s === symbol);
  return treffer ? { ...treffer[1] } : null;
}

export function symbolVon(f: Figur): string {
  const treffer = SYMBOLE.find(([, g]) => g.farbe === f.farbe && g.art === f.art);
  if (!treffer) throw new Error(`Keine Figur: ${f.farbe} ${f.art}`);
  return treffer[0];
}

/**
 * Liest acht Reihenzeilen der Form `  8  r n b q k b n r`. Führende
 * Leerzeichen und Spaltenbreite sind egal — getrennt wird an beliebig vielen
 * Leerzeichen.
 */
export function liesReihen(reihen: string[]): Stellung {
  if (reihen.length !== 8) {
    throw new Error(`Brett braucht 8 Reihen, bekommen: ${reihen.length}`);
  }
  const stellung = leereStellung();
  reihen.forEach((zeile, index) => {
    const zellen = zeile.trim().split(/\s+/);
    const reihe = zellen.shift();
    if (reihe !== REIHEN[index]) {
      throw new Error(`Reihe ${REIHEN[index]} erwartet, gefunden: ${reihe ?? '(leer)'}`);
    }
    if (zellen.length !== 8) {
      throw new Error(`Reihe ${reihe} braucht 8 Felder, hat ${zellen.length}`);
    }
    zellen.forEach((zelle, linie) => {
      if (zelle === '.') return;
      const f = figurVon(zelle);
      if (f === null) {
        throw new Error(`Unbekanntes Figurensymbol in Reihe ${reihe}: ${zelle}`);
      }
      stellung[`${LINIEN[linie]}${reihe}` as Feld] = f;
    });
  });
  return stellung;
}

/**
 * Die Umkehrung — acht Zeilen genau in der Form einer `.case`-Datei. Bretter
 * werden als dieser Text verglichen: ein Zeilendiff ist lesbar, ein
 * Objektdump nicht.
 */
export function zeichne(stellung: Stellung): string {
  return REIHEN.map((reihe) => {
    const zellen = LINIEN.map((linie) => {
      const f = stellung[`${linie}${reihe}` as Feld];
      return f === null ? '.' : symbolVon(f);
    });
    return `  ${reihe}  ${zellen.join(' ')}`;
  }).join('\n');
}

/** Nimmt mehrzeiligen Text und liest die Zeilen, die mit 1–8 beginnen. */
export function brettbild(text: string): Stellung {
  const reihen = text.split('\n').filter((zeile) => /^\s*[1-8]\s/.test(zeile));
  return liesReihen(reihen);
}

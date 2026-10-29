/**
 * Das Datenmodell der E2E-Tests — reines TypeScript, ohne Playwright.
 * Begriffe nach docs/context.md.
 */
export type Farbe = 'weiss' | 'schwarz';
export type Feld = `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
export type Figurart = 'koenig' | 'dame' | 'turm' | 'laeufer' | 'springer' | 'bauer';
export type Figur = { farbe: Farbe; art: Figurart };
export type Zug = { von: Feld; nach: Feld };
export type Stellung = Record<Feld, Figur | null>;
export type Zuganzeige =
  | 'du-bist-am-zug'
  | 'gegner-ist-am-zug'
  | 'zug-wird-gespielt'
  | 'zuschauer'
  | 'keine';
/** Welche Seite des Bretts unten steht — aus der Bildschirmlage, nicht aus der DOM-Reihenfolge. */
export type Ausrichtung = 'weiss-unten' | 'schwarz-unten';
export type Partie = { id: string; einladungslink: string };

const LINIEN = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const REIHEN = [8, 7, 6, 5, 4, 3, 2, 1] as const;

/** a8..h8, a7..h7, …, a1..h1 — die Reihenfolge, in der ein Brett gezeichnet wird. */
export const FELDER: readonly Feld[] = REIHEN.flatMap((reihe) =>
  LINIEN.map((linie) => `${linie}${reihe}` as Feld),
);

const FELDMENGE: ReadonlySet<string> = new Set(FELDER);

export function istFeld(text: string): text is Feld {
  return FELDMENGE.has(text);
}

export function zug(von: Feld, nach: Feld): Zug;
export function zug(kurz: string): Zug;
export function zug(vonOderKurz: string, nach?: Feld): Zug {
  if (nach !== undefined) {
    return { von: vonOderKurz as Feld, nach };
  }
  const von = vonOderKurz.slice(0, 2);
  const ziel = vonOderKurz.slice(2);
  if (vonOderKurz.length !== 4 || !istFeld(von) || !istFeld(ziel)) {
    throw new Error(`kein Feldpaar: ${vonOderKurz}`);
  }
  return { von, nach: ziel };
}

export function figur(farbe: Farbe, art: Figurart): Figur {
  return { farbe, art };
}

export function leereStellung(): Stellung {
  return Object.fromEntries(FELDER.map((feld) => [feld, null])) as Stellung;
}

export function gegner(farbe: Farbe): Farbe {
  return farbe === 'weiss' ? 'schwarz' : 'weiss';
}

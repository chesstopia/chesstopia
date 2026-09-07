import { parseBoardRows, type BoardMap } from './board';

export type Halbzug = { from: string; to: string };

export type CorpusCase = {
  description: string;
  moves: Halbzug[];
  turn: 'white' | 'black' | null;
  banner: string | null;
  error: string | null;
  locked: Halbzug | null;
  board: BoardMap;
};

const SCHLUESSEL = ['description', 'moves', 'turn', 'banner', 'error', 'locked'];
const FELD = /^[a-h][1-8]$/;

/**
 * Liest eine `.case`-Datei des E2E-Korpus.
 *
 * Grammatik, bewusst kleiner als die der Engine: Kopfzeilen `schlüssel = wert`,
 * dann ein Block, der mit einer Zeile `BOARD` beginnt und acht Reihenzeilen
 * enthält. Kein `ruleset`, kein zweites Brett, keine Metazeile — was die
 * Oberfläche nicht zeigt, steht nicht in der Erwartung.
 */
export function parseCase(raw: string, name: string): CorpusCase {
  // Die Typannotation steht bewusst an der Variablen, nicht nur am Pfeil:
  // TypeScript verengt den Kontrollfluss nach einem `never`-Aufruf nur dann,
  // wenn die Deklaration den Typ explizit trägt.
  const scheitern: (grund: string) => never = (grund) => {
    throw new Error(`Testfall '${name}' nicht parsebar: ${grund}`);
  };

  const zeilen = raw.split('\n');
  const brettStart = zeilen.findIndex((zeile) => zeile.trim() === 'BOARD');
  if (brettStart === -1) scheitern('kein BOARD-Block gefunden');

  const kopf = new Map<string, string>();
  for (const zeile of zeilen.slice(0, brettStart)) {
    if (zeile.trim() === '') continue;
    const teiler = zeile.indexOf('=');
    if (teiler === -1) scheitern(`Kopfzeile ohne '=': ${zeile.trim()}`);
    const schluessel = zeile.slice(0, teiler).trim();
    if (!SCHLUESSEL.includes(schluessel)) scheitern(`unbekannter Schlüssel: ${schluessel}`);
    kopf.set(schluessel, zeile.slice(teiler + 1).trim());
  }

  const reihen = zeilen
    .slice(brettStart + 1)
    .filter((zeile) => /^\s*[1-8]\s/.test(zeile))
    .slice(0, 8);
  // Nicht als `let` mit Zuweisung im try: TypeScript hält eine dort gesetzte
  // Variable danach für möglicherweise nicht zugewiesen.
  const board = leseBrett(reihen, scheitern);

  const description = kopf.get('description') ?? '';
  if (description === '') scheitern('description fehlt');

  const rohzuege = (kopf.get('moves') ?? '').split(/\s+/).filter((zug) => zug !== '');
  if (rohzuege.length === 0) scheitern('moves fehlt oder ist leer');
  const moves = rohzuege.map((zug) => zerlege(zug, scheitern));

  const turnRoh = kopf.get('turn') ?? null;
  const banner = kopf.get('banner') ?? null;
  if ((turnRoh === null) === (banner === null)) {
    scheitern('genau eines von `turn` und `banner` muss gesetzt sein');
  }
  if (turnRoh !== null && turnRoh !== 'white' && turnRoh !== 'black') {
    scheitern(`turn muss white oder black sein, ist: ${turnRoh}`);
  }

  const lockedRoh = kopf.get('locked') ?? null;
  const locked =
    lockedRoh === null ? null : zerlege(lockedRoh.replace(/\s+/g, ''), scheitern);

  return {
    description,
    moves,
    turn: turnRoh as 'white' | 'black' | null,
    banner,
    error: kopf.get('error') ?? null,
    locked,
    board,
  };
}

function leseBrett(reihen: string[], scheitern: (grund: string) => never): BoardMap {
  try {
    return parseBoardRows(reihen);
  } catch (fehler) {
    scheitern(fehler instanceof Error ? fehler.message : String(fehler));
  }
}

function zerlege(zug: string, scheitern: (grund: string) => never): Halbzug {
  const from = zug.slice(0, 2);
  const to = zug.slice(2);
  if (zug.length !== 4 || !FELD.test(from) || !FELD.test(to)) {
    scheitern(`kein Feldpaar: ${zug}`);
  }
  return { from, to };
}

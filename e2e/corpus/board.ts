/**
 * Das ASCII-Brett des Korpus — dieselbe Darstellung wie in
 * `chess-engine/testcases/`, bewusst als echte Teilmenge: ein Brett, keine
 * Metazeile mit castling/ep/hm/fm. Was hier verglichen wird, ist die
 * gerenderte Oberfläche, und die zeigt diese Felder nicht.
 *
 * Grossbuchstabe = Weiß, Kleinbuchstabe = Schwarz, `.` = leeres Feld. Die
 * Figurencodes sind die der Oberfläche (`data-piece="wK"`), damit Datei und
 * DOM ohne Zwischenübersetzung vergleichbar sind.
 */
export type PieceCode =
  | 'wK' | 'wQ' | 'wR' | 'wB' | 'wN' | 'wP'
  | 'bK' | 'bQ' | 'bR' | 'bB' | 'bN' | 'bP';

export type BoardMap = Record<string, PieceCode | null>;

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

const SYMBOL_TO_PIECE: Record<string, PieceCode> = {
  K: 'wK', Q: 'wQ', R: 'wR', B: 'wB', N: 'wN', P: 'wP',
  k: 'bK', q: 'bQ', r: 'bR', b: 'bB', n: 'bN', p: 'bP',
};

const PIECE_TO_SYMBOL: Record<PieceCode, string> = Object.fromEntries(
  Object.entries(SYMBOL_TO_PIECE).map(([symbol, piece]) => [piece, symbol]),
) as Record<PieceCode, string>;

export function emptyBoard(): BoardMap {
  const board: BoardMap = {};
  for (const rank of RANKS) {
    for (const file of FILES) {
      board[`${file}${rank}`] = null;
    }
  }
  return board;
}

/**
 * Liest acht Reihenzeilen der Form `  8  r n b q k b n r`.
 *
 * Führende Leerzeichen und die Spaltenbreite sind egal — getrennt wird an
 * beliebig vielen Leerzeichen. Das ist genau die Toleranz, die der
 * Driftwächter braucht, um die Zeilen einer Engine-`.case`-Datei zu lesen.
 */
export function parseBoardRows(rows: string[]): BoardMap {
  if (rows.length !== 8) {
    throw new Error(`Brett braucht 8 Reihen, bekommen: ${rows.length}`);
  }
  const board = emptyBoard();
  rows.forEach((row, index) => {
    const cells = row.trim().split(/\s+/);
    const rank = cells.shift();
    if (rank !== RANKS[index]) {
      throw new Error(`Reihe ${RANKS[index]} erwartet, gefunden: ${rank ?? '(leer)'}`);
    }
    if (cells.length !== 8) {
      throw new Error(`Reihe ${rank} braucht 8 Felder, hat ${cells.length}`);
    }
    cells.forEach((cell, fileIndex) => {
      if (cell === '.') return;
      const piece = SYMBOL_TO_PIECE[cell];
      if (piece === undefined) {
        throw new Error(`Unbekanntes Figurensymbol in Reihe ${rank}: ${cell}`);
      }
      board[`${FILES[fileIndex]}${rank}`] = piece;
    });
  });
  return board;
}

/**
 * Die Umkehrung — acht Zeilen in genau der Form, in der sie in einer
 * `.case`-Datei stehen. Der Läufer vergleicht Bretter als diesen Text, nicht
 * als Objekt: ein Zeilendiff zweier Bretter ist lesbar, ein Objektdump nicht.
 */
export function renderBoard(board: BoardMap): string {
  return RANKS.map((rank) => {
    const cells = FILES.map((file) => {
      const piece = board[`${file}${rank}`];
      return piece === null || piece === undefined ? '.' : PIECE_TO_SYMBOL[piece];
    });
    return `  ${rank}  ${cells.join(' ')}`;
  }).join('\n');
}

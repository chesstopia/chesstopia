/**
 * Übersetzung zwischen Brettindex und Feldnamen.
 *
 * Das Brett ist `board[rank][file]` mit `rank 0` = Reihe 8 (siehe `fen.ts`) —
 * dieselbe Leserichtung wie eine FEN. Ein Feldname liest sich umgekehrt: `e2`
 * nennt erst die Linie, dann die Reihe. Genau dieser Dreh ist die Stelle, an
 * der ein Brett unbemerkt auf dem Kopf steht.
 */

const FILES = 'abcdefgh';

export function toSquare(rankIdx: number, fileIdx: number): string {
  if (rankIdx < 0 || rankIdx > 7 || fileIdx < 0 || fileIdx > 7) {
    throw new RangeError(`Feld liegt außerhalb des Bretts: ${rankIdx},${fileIdx}`);
  }
  return `${FILES[fileIdx]}${8 - rankIdx}`;
}

export function fromSquare(square: string): { rankIdx: number; fileIdx: number } {
  const fileIdx = FILES.indexOf(square[0]);
  const rank = Number(square[1]);
  if (square.length !== 2 || fileIdx < 0 || !Number.isInteger(rank) || rank < 1 || rank > 8) {
    throw new RangeError(`Kein Feldname: ${square}`);
  }
  return { rankIdx: 8 - rank, fileIdx };
}

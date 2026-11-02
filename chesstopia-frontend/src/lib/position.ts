import type { GameResponse, Position, Square } from '@chesstopia/openapi-client';
import { toSquare } from './squares';

export type PieceCode =
  | 'wK' | 'wQ' | 'wR' | 'wB' | 'wN' | 'wP'
  | 'bK' | 'bQ' | 'bR' | 'bB' | 'bN' | 'bP';

/** board[rank][file], rank 0 = Reihe 8, file 0 = a-Linie. */
export type Board = (PieceCode | null)[][];
export type Side = 'w' | 'b';

/** Der König, der einen Rahmen bekommt: im Schach oder mattgesetzt. */
export type KingMarker = { square: string; kind: 'check' | 'mate' };

const RANKS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];
const FILES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const TYPE_LETTER: Record<string, string> = {
  KING: 'K', QUEEN: 'Q', ROOK: 'R', BISHOP: 'B', KNIGHT: 'N', PAWN: 'P',
};

function rankIdx(square: Square): number {
  return 7 - RANKS.indexOf(square.rank);
}
function fileIdx(square: Square): number {
  return FILES.indexOf(square.file);
}

export function toBoard(position: Position): Board {
  const board: Board = Array.from({ length: 8 }, () => Array<PieceCode | null>(8).fill(null));
  for (const { square, piece } of position.board) {
    const code = (piece.color === 'WHITE' ? 'w' : 'b') + TYPE_LETTER[piece.type];
    board[rankIdx(square)][fileIdx(square)] = code as PieceCode;
  }
  return board;
}

/** Feldname des Königs von `side` (z. B. `"e1"`); `null`, wenn er nicht auf dem Brett steht. */
export function kingSquare(board: Board, side: Side): string | null {
  for (let rank = 0; rank < 8; rank++) {
    const file = board[rank].indexOf(`${side}K`);
    if (file >= 0) return toSquare(rank, file);
  }
  return null;
}

export function sideOf(position: Position): Side {
  return position.sideToMove === 'BLACK' ? 'b' : 'w';
}

/** Wer im Schach steht, sagt allein `checkState` (ADR-0033); `null` ohne Schach. */
export function checkedSide(checkState: GameResponse['checkState']): Side | null {
  return checkState === 'CHECK_WHITE' ? 'w' : checkState === 'CHECK_BLACK' ? 'b' : null;
}

const FILE_BY_LETTER: Record<string, Square['file']> = {
  a: 'A', b: 'B', c: 'C', d: 'D', e: 'E', f: 'F', g: 'G', h: 'H',
};
const RANK_BY_DIGIT: Record<string, Square['rank']> = {
  '1': 'ONE', '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE', '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT',
};

/** `"e2"` → `{ file: 'E', rank: 'TWO' }`. */
export function parseSquare(name: string): Square {
  const file = FILE_BY_LETTER[name[0]];
  const rank = RANK_BY_DIGIT[name[1]];
  if (name.length !== 2 || !file || !rank) throw new RangeError(`Kein Feldname: ${name}`);
  return { file, rank };
}

/** `{ file: 'E', rank: 'TWO' }` → `"e2"` — Gegenstück zu `parseSquare`. */
export function formatSquare(square: Square): string {
  return `${square.file.toLowerCase()}${RANKS.indexOf(square.rank) + 1}`;
}

import type { Position, Square } from '@chesstopia/openapi-client';

export type PieceCode =
  | 'wK' | 'wQ' | 'wR' | 'wB' | 'wN' | 'wP'
  | 'bK' | 'bQ' | 'bR' | 'bB' | 'bN' | 'bP';

/** board[rank][file], rank 0 = Reihe 8, file 0 = a-Linie. */
export type Board = (PieceCode | null)[][];
export type Side = 'w' | 'b';

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

export function sideOf(position: Position): Side {
  return position.sideToMove === 'BLACK' ? 'b' : 'w';
}

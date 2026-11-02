import { describe, expect, it } from 'vitest';
import type { Board } from '../position';
import { toMoveRequest } from '../moveRequest';

const emptyBoard = (): Board => Array.from({ length: 8 }, () => Array(8).fill(null));
const boardWith = (rankIdx: number, fileIdx: number, piece: Board[number][number]): Board => {
  const board = emptyBoard();
  board[rankIdx][fileIdx] = piece;
  return board;
};

describe('moveRequest', () => {
  it('wandelt einen weißen Bauern auf Reihe 8 in eine Dame um', () => {
    // ARRANGE
    const board = boardWith(1, 4, 'wP');

    // ACT
    const move = toMoveRequest(board, 'e7', 'e8');

    // ASSERTIONS
    expect(move).toEqual({ from: { file: 'E', rank: 'SEVEN' }, to: { file: 'E', rank: 'EIGHT' }, promotion: 'QUEEN' });
  });

  it('wandelt einen schwarzen Bauern auf Reihe 1 in eine Dame um', () => {
    // ARRANGE
    const board = boardWith(6, 4, 'bP');

    // ACT
    const move = toMoveRequest(board, 'e2', 'e1');

    // ASSERTIONS
    expect(move.promotion).toBe('QUEEN');
  });

  it('wandelt einen Turm auf Reihe 8 nicht um', () => {
    // ARRANGE
    const board = boardWith(1, 0, 'wR');

    // ACT
    const move = toMoveRequest(board, 'a7', 'a8');

    // ASSERTIONS
    expect(move.promotion).toBeUndefined();
  });

  it('wandelt einen Bauern ohne Grundreihe nicht um', () => {
    // ARRANGE
    const board = boardWith(6, 4, 'wP');

    // ACT
    const move = toMoveRequest(board, 'e2', 'e4');

    // ASSERTIONS
    expect(move).toEqual({ from: { file: 'E', rank: 'TWO' }, to: { file: 'E', rank: 'FOUR' }, promotion: undefined });
  });
});

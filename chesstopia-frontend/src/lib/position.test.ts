import { describe, it, expect } from 'vitest';
import { toBoard, sideOf, parseSquare } from './position';
import type { Position } from '@chesstopia/openapi-client';

const startish: Position = {
  board: [
    { square: { file: 'E', rank: 'ONE' }, piece: { type: 'KING', color: 'WHITE' } },
    { square: { file: 'D', rank: 'EIGHT' }, piece: { type: 'QUEEN', color: 'BLACK' } },
  ],
  sideToMove: 'BLACK',
  castlingRights: { whiteKingSide: true, whiteQueenSide: true, blackKingSide: true, blackQueenSide: true },
  halfmoveClock: 0,
  fullmoveNumber: 1,
};

describe('toBoard', () => {
  it('legt Figuren auf die richtigen Matrixfelder', () => {
    const board = toBoard(startish);
    expect(board[7][4]).toBe('wK'); // e1
    expect(board[0][3]).toBe('bQ'); // d8
    expect(board[4][4]).toBeNull(); // e4
  });

  it('liefert acht Reihen zu acht Feldern', () => {
    const board = toBoard(startish);
    expect(board).toHaveLength(8);
    expect(board.every((r) => r.length === 8)).toBe(true);
  });
});

describe('sideOf', () => {
  it('bildet WHITE/BLACK auf w/b ab', () => {
    expect(sideOf(startish)).toBe('b');
  });
});

describe('parseSquare', () => {
  it('übersetzt einen Feldnamen in die strukturierte Form', () => {
    expect(parseSquare('e2')).toEqual({ file: 'E', rank: 'TWO' });
    expect(parseSquare('h8')).toEqual({ file: 'H', rank: 'EIGHT' });
  });

  it('wirft RangeError bei einem unmöglichen oder unvollständigen Feldnamen', () => {
    expect(() => parseSquare('x9')).toThrow(RangeError);
    expect(() => parseSquare('e')).toThrow(RangeError);
  });
});

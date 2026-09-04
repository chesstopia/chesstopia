import { describe, it, expect } from 'vitest';
import type { Position } from '@chesstopia/openapi-client';
import { isLegalMove } from '../engine';

const START: Position = {
  board: [
    { square: { file: 'E', rank: 'TWO' }, piece: { type: 'PAWN', color: 'WHITE' } },
    { square: { file: 'E', rank: 'ONE' }, piece: { type: 'KING', color: 'WHITE' } },
    { square: { file: 'E', rank: 'EIGHT' }, piece: { type: 'KING', color: 'BLACK' } },
  ],
  sideToMove: 'WHITE',
  castlingRights: { whiteKingSide: false, whiteQueenSide: false, blackKingSide: false, blackQueenSide: false },
  halfmoveClock: 0,
  fullmoveNumber: 1,
};

describe('engine', () => {
  it('nimmt den Bauern-Doppelschritt an', () => {
    // ACT & ASSERTIONS
    expect(isLegalMove(START, { from: { file: 'E', rank: 'TWO' }, to: { file: 'E', rank: 'FOUR' } })).toBe(true);
  });

  it('lehnt einen Zug ab, der den eigenen König im Schach lässt', () => {
    // ARRANGE — schwarzer Turm e8 fesselt nichts, aber König darf nicht auf e-Linie bleiben angegriffen
    const pinned: Position = {
      ...START,
      board: [
        { square: { file: 'E', rank: 'ONE' }, piece: { type: 'KING', color: 'WHITE' } },
        { square: { file: 'E', rank: 'TWO' }, piece: { type: 'BISHOP', color: 'WHITE' } },
        { square: { file: 'E', rank: 'EIGHT' }, piece: { type: 'ROOK', color: 'BLACK' } },
      ],
    };

    // ACT & ASSERTIONS
    expect(isLegalMove(pinned, { from: { file: 'E', rank: 'TWO' }, to: { file: 'C', rank: 'FOUR' } })).toBe(false);
  });

  it('reicht die Umwandlungsfigur durch', () => {
    // ARRANGE
    const promo: Position = {
      ...START,
      board: [
        { square: { file: 'A', rank: 'SEVEN' }, piece: { type: 'PAWN', color: 'WHITE' } },
        { square: { file: 'E', rank: 'ONE' }, piece: { type: 'KING', color: 'WHITE' } },
        { square: { file: 'H', rank: 'EIGHT' }, piece: { type: 'KING', color: 'BLACK' } },
      ],
    };

    // ACT & ASSERTIONS
    expect(isLegalMove(promo, {
      from: { file: 'A', rank: 'SEVEN' }, to: { file: 'A', rank: 'EIGHT' }, promotion: 'QUEEN',
    })).toBe(true);
    expect(isLegalMove(promo, { from: { file: 'A', rank: 'SEVEN' }, to: { file: 'A', rank: 'EIGHT' } })).toBe(false);
  });
});

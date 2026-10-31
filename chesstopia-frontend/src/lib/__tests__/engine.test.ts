import { describe, it, expect } from 'vitest';
import type { Position } from '@chesstopia/openapi-client';
import { isInCheck, isLegalMove } from '../engine';

// Kein Regeltest — die Schachregeln prüft der Kotlin-Testkorpus. Hier geht es nur
// darum, dass die Verdrahtung zur kompilierten Engine hält: UMD-Namespace,
// Enum-Maps (FILE/RANK/COLOR/TYPE) und der validateMove-Aufruf über die
// DTO→@JsExport-Übersetzung in engine.ts.
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
  it('reicht die DTO-Übersetzung durch bis zum Urteil der Engine', () => {
    // ACT & ASSERTIONS
    expect(isLegalMove(START, { from: { file: 'E', rank: 'TWO' }, to: { file: 'E', rank: 'FOUR' } })).toBe(true);
    expect(isLegalMove(START, { from: { file: 'E', rank: 'TWO' }, to: { file: 'E', rank: 'FIVE' } })).toBe(false);
  });

  it('meldet Schach über die Engine', () => {
    // ARRANGE — schwarze Dame h4 greift den weißen König e1 an
    const check: Position = {
      ...START,
      board: [
        { square: { file: 'E', rank: 'ONE' }, piece: { type: 'KING', color: 'WHITE' } },
        { square: { file: 'H', rank: 'FOUR' }, piece: { type: 'QUEEN', color: 'BLACK' } },
        { square: { file: 'E', rank: 'EIGHT' }, piece: { type: 'KING', color: 'BLACK' } },
      ],
    };

    // ACT & ASSERTIONS
    expect(isInCheck(check)).toBe(true);
    expect(isInCheck(START)).toBe(false);
  });
});

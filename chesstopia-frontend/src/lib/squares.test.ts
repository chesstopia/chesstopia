import { describe, expect, it } from 'vitest';
import { fromSquare, toSquare } from './squares';

describe('toSquare', () => {
  it('benennt die Ecken des Bretts', () => {
    // a8 ist das erste Feld einer strukturierten Stellung und im Brett bei [0][0] — dreht sich das um,
    // spielt das Brett spiegelverkehrt und niemand sieht es an den Figuren.

    // ACT & ASSERTIONS
    expect(toSquare(0, 0)).toBe('a8');
    expect(toSquare(0, 7)).toBe('h8');
    expect(toSquare(7, 0)).toBe('a1');
    expect(toSquare(7, 7)).toBe('h1');
  });

  it('benennt ein Feld in der Mitte', () => {
    // ACT & ASSERTIONS
    expect(toSquare(6, 4)).toBe('e2');
    expect(toSquare(4, 4)).toBe('e4');
  });

  it('lehnt Indizes außerhalb des Bretts ab', () => {
    // ACT & ASSERTIONS
    expect(() => toSquare(8, 0)).toThrow(RangeError);
    expect(() => toSquare(0, -1)).toThrow(RangeError);
  });
});

describe('fromSquare', () => {
  it('ist die Umkehrung von toSquare', () => {
    // ACT & ASSERTIONS
    for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
      for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
        expect(fromSquare(toSquare(rankIdx, fileIdx))).toEqual({ rankIdx, fileIdx });
      }
    }
  });

  it('lehnt ab, was kein Feldname ist', () => {
    // ACT & ASSERTIONS
    expect(() => fromSquare('i1')).toThrow(RangeError);
    expect(() => fromSquare('a9')).toThrow(RangeError);
    expect(() => fromSquare('e')).toThrow(RangeError);
  });
});

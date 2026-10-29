import { describe, it, expect } from 'vitest';
import { neutralResult, ownResult, outcomeBadge, outcomeKind } from '../outcome';

describe('outcome', () => {
  describe('ownResult', () => {
    it.each([
      ['ONGOING', 'w', null],
      ['ONGOING', 'b', null],
      ['ONGOING', null, null],
      ['WHITE_WON', 'w', 'Du hast gewonnen'],
      ['WHITE_WON', 'b', 'Du hast verloren'],
      ['WHITE_WON', null, null],
      ['BLACK_WON', 'w', 'Du hast verloren'],
      ['BLACK_WON', 'b', 'Du hast gewonnen'],
      ['BLACK_WON', null, null],
      ['DRAW', 'w', 'Remis'],
      ['DRAW', 'b', 'Remis'],
      ['DRAW', null, null],
    ] as const)('%s als %s ergibt %s', (status, role, expected) => {
      // ACT & ASSERTIONS
      expect(ownResult(status, role)).toBe(expected);
    });
  });

  describe('outcomeKind', () => {
    it.each([
      ['ONGOING', 'w', null],
      ['WHITE_WON', 'w', 'won'],
      ['WHITE_WON', 'b', 'lost'],
      ['BLACK_WON', 'b', 'won'],
      ['BLACK_WON', 'w', 'lost'],
      ['DRAW', 'w', 'draw'],
      ['DRAW', 'b', 'draw'],
    ] as const)('%s als %s ergibt %s', (status, side, expected) => {
      // ACT & ASSERTIONS
      expect(outcomeKind(status, side)).toBe(expected);
    });

    it('wirft bei unbekanntem Status, statt ihn als Schwarz-Sieg zu werten', () => {
      // ACT & ASSERTIONS
      expect(() => outcomeKind('ABANDONED' as never, 'w')).toThrow('Unbekannter Partiestatus');
    });
  });

  describe('neutralResult', () => {
    it.each([
      ['ONGOING', null, null],
      ['ONGOING', 'STALEMATE', null],
      ['WHITE_WON', null, 'Schachmatt — Weiß gewinnt'],
      ['BLACK_WON', null, 'Schachmatt — Schwarz gewinnt'],
      ['WHITE_WON', 'STALEMATE', 'Schachmatt — Weiß gewinnt'],
      ['DRAW', null, 'Remis'],
      ['DRAW', undefined, 'Remis'],
      ['DRAW', 'STALEMATE', 'Remis (Patt)'],
      ['DRAW', 'FIFTY_MOVE_RULE', 'Remis (50-Züge-Regel)'],
      ['DRAW', 'INSUFFICIENT_MATERIAL', 'Remis (ungenügendes Material)'],
      ['DRAW', 'THREEFOLD_REPETITION', 'Remis (dreifache Stellungswiederholung)'],
    ] as const)('%s mit %s ergibt %s', (status, endReason, expected) => {
      // ACT & ASSERTIONS
      expect(neutralResult(status, endReason)).toBe(expected);
    });
  });

  describe('outcomeBadge', () => {
    it('benennt Matt aus beiden Sichten', () => {
      // ACT & ASSERTIONS
      expect(outcomeBadge('WHITE_WON', null, 'w')).toBe('Gewonnen · Schachmatt');
      expect(outcomeBadge('WHITE_WON', null, 'b')).toBe('Verloren · Schachmatt');
      expect(outcomeBadge('BLACK_WON', null, 'b')).toBe('Gewonnen · Schachmatt');
      expect(outcomeBadge('BLACK_WON', null, 'w')).toBe('Verloren · Schachmatt');
    });

    it.each([
      ['STALEMATE', 'Remis · Patt'],
      ['FIFTY_MOVE_RULE', 'Remis · 50-Züge-Regel'],
      ['INSUFFICIENT_MATERIAL', 'Remis · ungenügendes Material'],
      ['THREEFOLD_REPETITION', 'Remis · dreifache Stellungswiederholung'],
    ] as const)('benennt Remis wegen %s', (endReason, expected) => {
      // ACT & ASSERTIONS
      expect(outcomeBadge('DRAW', endReason, 'w')).toBe(expected);
    });
  });
});

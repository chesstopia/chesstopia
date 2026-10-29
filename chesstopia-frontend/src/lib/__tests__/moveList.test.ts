import { describe, it, expect } from 'vitest';
import type { MoveRecord } from '@chesstopia/openapi-client';
import { formatMove, pairMoves } from '../moveList';

const record = (n: number, move: MoveRecord['move']): MoveRecord =>
  ({ moveNumber: n, move, positionAfter: {}, playedAt: '2026-01-01T00:00:00Z' }) as unknown as MoveRecord;
const e2e4 = record(1, { from: { file: 'E', rank: 'TWO' }, to: { file: 'E', rank: 'FOUR' } });

describe('moveList', () => {
  describe('formatMove', () => {
    it('formatiert einen normalen Zug mit Gedankenstrich', () => {
      // ACT & ASSERTIONS
      expect(formatMove(e2e4)).toBe('e2–e4');
    });

    it.each([
      ['QUEEN', '=D'],
      ['ROOK', '=T'],
      ['BISHOP', '=L'],
      ['KNIGHT', '=S'],
    ] as const)('hängt die Umwandlung %s als %s an', (promotion, suffix) => {
      // ARRANGE
      const r = record(9, { from: { file: 'E', rank: 'SEVEN' }, to: { file: 'E', rank: 'EIGHT' }, promotion });

      // ACT & ASSERTIONS
      expect(formatMove(r)).toBe(`e7–e8${suffix}`);
    });
  });

  describe('pairMoves', () => {
    it('paart eine gerade Anzahl Züge', () => {
      // ARRANGE
      const records = [e2e4, record(2, e2e4.move)];

      // ACT
      const rows = pairMoves(records);

      // ASSERTIONS
      expect(rows).toEqual([{ number: 1, white: records[0], black: records[1] }]);
    });

    it('lässt bei ungerader Anzahl den letzten schwarzen Zug offen', () => {
      // ARRANGE
      const records = [e2e4, record(2, e2e4.move), record(3, e2e4.move)];

      // ACT
      const rows = pairMoves(records);

      // ASSERTIONS
      expect(rows).toHaveLength(2);
      expect(rows[1].number).toBe(2);
      expect(rows[1].white).toBe(records[2]);
      expect(rows[1].black).toBeUndefined();
    });

    it('liefert für keine Züge keine Zeilen', () => {
      // ACT & ASSERTIONS
      expect(pairMoves([])).toEqual([]);
    });
  });
});

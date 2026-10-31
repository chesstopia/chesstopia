import { describe, it, expect } from 'vitest';
import { BASE_TITLE, gameTitle, withAttention } from '../gameTitle';
import type { GameSnapshot } from '../feedback';

function snap(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return { moveCount: 1, sideToMove: 'w', inCheck: false, status: 'ONGOING', ...overrides };
}

describe('gameTitle', () => {
  describe('gameTitle', () => {
    it('zeigt Zuschauern immer den Basistitel', () => {
      // ACT & ASSERTIONS
      expect(gameTitle(snap({ inCheck: true }), null)).toBe(BASE_TITLE);
      expect(gameTitle(snap({ status: 'WHITE_WON' }), null)).toBe('Chesstopia');
    });

    it('zeigt den Sieg', () => {
      // ACT & ASSERTIONS
      expect(gameTitle(snap({ status: 'WHITE_WON', sideToMove: 'b' }), 'w')).toBe('Schachmatt – gewonnen · Chesstopia');
    });

    it('zeigt die Niederlage', () => {
      // ACT & ASSERTIONS
      expect(gameTitle(snap({ status: 'WHITE_WON', sideToMove: 'b' }), 'b')).toBe('Schachmatt – verloren · Chesstopia');
    });

    it('zeigt das Remis', () => {
      // ACT & ASSERTIONS
      expect(gameTitle(snap({ status: 'DRAW' }), 'w')).toBe('Remis · Chesstopia');
    });

    it('zeigt Schach, wenn man selbst am Zug ist und im Schach steht', () => {
      // ACT & ASSERTIONS
      expect(gameTitle(snap({ inCheck: true }), 'w')).toBe('Schach! · Chesstopia');
    });

    it('zeigt den Zug, wenn man selbst am Zug ist', () => {
      // ACT & ASSERTIONS
      expect(gameTitle(snap(), 'w')).toBe('Du bist am Zug · Chesstopia');
    });

    it('zeigt den Basistitel, wenn der Gegner am Zug ist, auch wenn er im Schach steht', () => {
      // ACT & ASSERTIONS
      expect(gameTitle(snap({ sideToMove: 'b' }), 'w')).toBe(BASE_TITLE);
      expect(gameTitle(snap({ sideToMove: 'b', inCheck: true }), 'w')).toBe(BASE_TITLE);
    });
  });

  describe('withAttention', () => {
    it('setzt das Präfix nur bei Aufmerksamkeit', () => {
      // ACT & ASSERTIONS
      expect(withAttention('Remis · Chesstopia', true)).toBe('● Remis · Chesstopia');
      expect(withAttention('Remis · Chesstopia', false)).toBe('Remis · Chesstopia');
    });
  });
});

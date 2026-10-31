import { describe, it, expect } from 'vitest';
import { detectFeedbackEvent, type GameSnapshot } from '../feedback';

function snap(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return { moveCount: 1, sideToMove: 'b', inCheck: false, status: 'ONGOING', ...overrides };
}

describe('feedback', () => {
  describe('detectFeedbackEvent', () => {
    it('meldet beim ersten Zustand nichts, auch nicht bei Matt oder Schach', () => {
      // ACT & ASSERTIONS
      expect(detectFeedbackEvent(null, snap(), 'w')).toBeNull();
      expect(detectFeedbackEvent(null, snap({ status: 'BLACK_WON', inCheck: true }), 'w')).toBeNull();
      expect(detectFeedbackEvent(null, snap({ inCheck: true, sideToMove: 'w' }), 'w')).toBeNull();
    });

    it('meldet nichts, wenn der moveCount nicht steigt (HTTP-Antwort und WS-Echo)', () => {
      // ARRANGE
      const prev = snap({ moveCount: 3, sideToMove: 'w' });

      // ACT & ASSERTIONS
      expect(detectFeedbackEvent(prev, snap({ moveCount: 3, sideToMove: 'w' }), 'w')).toBeNull();
    });

    it('meldet einen Gegnerzug ohne Schach als move', () => {
      // ACT & ASSERTIONS
      expect(detectFeedbackEvent(snap({ moveCount: 1 }), snap({ moveCount: 2, sideToMove: 'w' }), 'w')).toBe('move');
    });

    it('meldet einen eigenen Zug ohne Schach nicht', () => {
      // ACT & ASSERTIONS
      expect(detectFeedbackEvent(snap({ moveCount: 0, sideToMove: 'w' }), snap({ moveCount: 1, sideToMove: 'b' }), 'w')).toBeNull();
    });

    it('meldet ein Schach des Gegners als check-received', () => {
      // ACT & ASSERTIONS
      expect(
        detectFeedbackEvent(snap({ moveCount: 1 }), snap({ moveCount: 2, sideToMove: 'w', inCheck: true }), 'w'),
      ).toBe('check-received');
    });

    it('meldet ein eigenes Schach als check-given', () => {
      // ACT & ASSERTIONS
      expect(
        detectFeedbackEvent(snap({ moveCount: 0, sideToMove: 'w' }), snap({ moveCount: 1, sideToMove: 'b', inCheck: true }), 'w'),
      ).toBe('check-given');
    });

    it('meldet Sieg, Niederlage und Remis unabhängig davon, wer zuletzt zog', () => {
      // ARRANGE
      const prev = snap({ moveCount: 4 });

      // ACT & ASSERTIONS
      expect(detectFeedbackEvent(prev, snap({ moveCount: 5, status: 'WHITE_WON' }), 'w')).toBe('win');
      expect(detectFeedbackEvent(prev, snap({ moveCount: 5, status: 'WHITE_WON' }), 'b')).toBe('loss');
      expect(detectFeedbackEvent(prev, snap({ moveCount: 5, status: 'DRAW', sideToMove: 'w' }), 'w')).toBe('draw');
      expect(detectFeedbackEvent(prev, snap({ moveCount: 5, status: 'DRAW', sideToMove: 'b' }), 'w')).toBe('draw');
    });

    it('gibt dem Matt Vorrang vor dem Schach', () => {
      // ACT & ASSERTIONS
      expect(
        detectFeedbackEvent(snap({ moveCount: 4, sideToMove: 'w' }), snap({ moveCount: 5, inCheck: true, status: 'WHITE_WON' }), 'w'),
      ).toBe('win');
    });

    it('meldet bei einem Sprung über mehrere Züge genau ein Ereignis aus der neuen Stellung', () => {
      // ACT & ASSERTIONS
      expect(
        detectFeedbackEvent(snap({ moveCount: 4, sideToMove: 'w' }), snap({ moveCount: 6, sideToMove: 'w', inCheck: true }), 'w'),
      ).toBe('check-received');
    });

    it('gibt Zuschauern nur neutrale Ereignisse', () => {
      // ARRANGE
      const prev = snap({ moveCount: 1 });

      // ACT & ASSERTIONS
      expect(detectFeedbackEvent(prev, snap({ moveCount: 2, sideToMove: 'w' }), null)).toBe('move');
      expect(detectFeedbackEvent(prev, snap({ moveCount: 2, sideToMove: 'w', inCheck: true }), null)).toBe('check-given');
      expect(detectFeedbackEvent(prev, snap({ moveCount: 2, status: 'WHITE_WON' }), null)).toBe('draw');
    });
  });
});

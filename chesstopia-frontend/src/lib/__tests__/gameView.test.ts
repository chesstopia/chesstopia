import { describe, expect, it } from 'vitest';
import type { LoadedGame } from '@/hooks/useGameState';
import { deriveGameView } from '../gameView';
import type { Board } from '../position';

/** Weißer König auf e1, schwarzer auf e8. */
function kingsBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  board[0][4] = 'bK';
  board[7][4] = 'wK';
  return board;
}

function game(overrides: Partial<LoadedGame> = {}): LoadedGame {
  return {
    board: kingsBoard(),
    sideToMove: 'w',
    status: 'ONGOING',
    endReason: null,
    checkState: 'NO_CHECK',
    moveCount: 0,
    ...overrides,
  };
}

const base = { pending: false, deleted: false, spectatorFlipped: false, feedbackEvent: null };

describe('gameView', () => {
  it('zeigt Zuschauern Weiß unten, ohne Hinweis und ohne Sperre durch die Rolle', () => {
    // ARRANGE
    const g = game();

    // ACT
    const view = deriveGameView({ ...base, game: g, role: null });

    // ASSERTIONS
    expect(view.orientation).toBe('w');
    expect(view.bottom).toEqual({ side: 'w', label: 'Weiß', active: true, check: false, note: undefined });
    expect(view.top).toEqual({ side: 'b', label: 'Schwarz', active: false, check: false, note: undefined });
    expect(view.turnIndicator).toBe('zuschauer');
    expect(view.boardDisabled).toBe(true);
  });

  it('dreht die Ansicht der Zuschauer, wenn sie es wählen', () => {
    // ARRANGE
    const g = game();

    // ACT
    const view = deriveGameView({ ...base, game: g, role: null, spectatorFlipped: true });

    // ASSERTIONS
    expect(view.orientation).toBe('b');
    expect(view.bottom.side).toBe('b');
    expect(view.bottom.label).toBe('Schwarz');
    expect(view.top.side).toBe('w');
  });

  it('meldet Weiß am Zug: eigener Hinweis, Brett frei', () => {
    // ARRANGE
    const g = game({ sideToMove: 'w' });

    // ACT
    const view = deriveGameView({ ...base, game: g, role: 'w' });

    // ASSERTIONS
    expect(view.turnIndicator).toBe('du-bist-am-zug');
    expect(view.bottom).toEqual({ side: 'w', label: 'Du · Weiß', active: true, check: false, note: 'Du bist am Zug' });
    expect(view.top).toEqual({ side: 'b', label: 'Gegner · Schwarz', active: false, check: false, note: undefined });
    expect(view.boardDisabled).toBe(false);
  });

  it('meldet den Gegner am Zug: kein Hinweis, Brett gesperrt', () => {
    // ARRANGE
    const g = game({ sideToMove: 'b' });

    // ACT
    const view = deriveGameView({ ...base, game: g, role: 'w' });

    // ASSERTIONS
    expect(view.turnIndicator).toBe('gegner-ist-am-zug');
    expect(view.bottom.note).toBeUndefined();
    expect(view.bottom.active).toBe(false);
    expect(view.top.active).toBe(true);
    expect(view.boardDisabled).toBe(true);
  });

  it('zeigt bei pending den Hinweis „Zug wird gespielt…“ und sperrt das Brett', () => {
    // ARRANGE
    const g = game({ sideToMove: 'w' });

    // ACT
    const view = deriveGameView({ ...base, game: g, role: 'w', pending: true });

    // ASSERTIONS
    expect(view.turnIndicator).toBe('zug-wird-gespielt');
    expect(view.bottom.note).toBe('Zug wird gespielt…');
    expect(view.boardDisabled).toBe(true);
  });

  it('markiert Schach gegen Schwarz bei Rolle b: oben Weiß, König e8 markiert', () => {
    // ARRANGE
    const g = game({ sideToMove: 'b', checkState: 'CHECK_BLACK' });

    // ACT
    const view = deriveGameView({ ...base, game: g, role: 'b' });

    // ASSERTIONS
    expect(view.orientation).toBe('b');
    expect(view.bottom).toMatchObject({ side: 'b', label: 'Du · Schwarz', check: true, active: true });
    expect(view.top.check).toBe(false);
    expect(view.kingMarker).toEqual({ square: 'e8', kind: 'check' });
  });

  it('markiert nach dem Matt den König als mate und nimmt Schach-Abzeichen, Hinweis und Anzeige weg', () => {
    // ARRANGE
    const g = game({ sideToMove: 'b', checkState: 'CHECK_BLACK', status: 'WHITE_WON' });

    // ACT
    const view = deriveGameView({ ...base, game: g, role: 'b' });

    // ASSERTIONS
    expect(view.over).toBe(true);
    expect(view.kingMarker).toEqual({ square: 'e8', kind: 'mate' });
    expect(view.bottom).toEqual({ side: 'b', label: 'Du · Schwarz', active: false, check: false, note: undefined });
    expect(view.top.active).toBe(false);
    expect(view.turnIndicator).toBeUndefined();
    expect(view.boardDisabled).toBe(true);
  });

  it('sperrt das Brett und blendet die Zuganzeige bei gelöschter Partie aus', () => {
    // ARRANGE
    const g = game({ sideToMove: 'w' });

    // ACT
    const view = deriveGameView({ ...base, game: g, role: 'w', deleted: true });

    // ASSERTIONS
    expect(view.boardDisabled).toBe(true);
    expect(view.turnIndicator).toBeUndefined();
    expect(view.bottom.note).toBeUndefined();
  });

  it.each([
    ['check-received', true],
    ['check-given', true],
    ['move', false],
  ] as const)('animateCheck bei %s ist %s', (feedbackEvent, expected) => {
    // ARRANGE
    const g = game({ sideToMove: 'w', checkState: 'CHECK_WHITE' });

    // ACT
    const view = deriveGameView({ ...base, game: g, role: 'w', feedbackEvent });

    // ASSERTIONS
    expect(view.animateCheck).toBe(expected);
  });
});

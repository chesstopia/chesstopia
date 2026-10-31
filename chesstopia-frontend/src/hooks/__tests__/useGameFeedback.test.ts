import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const { playSound } = vi.hoisted(() => ({ playSound: vi.fn() }));
vi.mock('@/lib/sound', () => ({ playSound }));

import { useGameFeedback } from '../useGameFeedback';
import { STANDARD } from '@/components/sound/theme/soundTheme';

type Args = Parameters<typeof useGameFeedback>[0];

const WHITE_TO_MOVE: Args = { role: 'w', moveCount: 2, sideToMove: 'w', inCheck: false, status: 'ONGOING' };

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
}

describe('useGameFeedback', () => {
  beforeEach(() => {
    localStorage.clear();
    playSound.mockReset();
    setHidden(false);
    document.title = 'Chesstopia';
  });

  afterEach(() => setHidden(false));

  it('spielt beim ersten Zustand keinen Ton und setzt den Titel ohne Markierung', () => {
    // ACT
    renderHook(() => useGameFeedback({ ...WHITE_TO_MOVE, sideToMove: 'b', inCheck: true, status: 'BLACK_WON' }));

    // ASSERTIONS
    expect(playSound).not.toHaveBeenCalled();
    expect(document.title).toBe('Schachmatt – verloren · Chesstopia');
  });

  it('wertet nichts aus, solange keine Stellung geladen ist', () => {
    // ARRANGE
    const { rerender } = renderHook((args: Args) => useGameFeedback(args), {
      initialProps: { ...WHITE_TO_MOVE, sideToMove: null, moveCount: 0 } as Args,
    });

    // ACT
    rerender(WHITE_TO_MOVE);

    // ASSERTIONS
    expect(playSound).not.toHaveBeenCalled();
  });

  it('spielt den Zug-Ton, wenn der Gegner gezogen hat', () => {
    // ARRANGE
    const { rerender } = renderHook((args: Args) => useGameFeedback(args), {
      initialProps: { ...WHITE_TO_MOVE, moveCount: 1, sideToMove: 'b' },
    });

    // ACT
    rerender(WHITE_TO_MOVE);

    // ASSERTIONS
    expect(playSound).toHaveBeenCalledExactlyOnceWith(STANDARD.sounds.move);
    expect(document.title).toBe('Du bist am Zug · Chesstopia');
  });

  it('spielt bei gleichem moveCount nur einmal', () => {
    // ARRANGE
    const { rerender } = renderHook((args: Args) => useGameFeedback(args), {
      initialProps: { ...WHITE_TO_MOVE, moveCount: 1, sideToMove: 'b' },
    });

    // ACT
    rerender(WHITE_TO_MOVE);
    rerender({ ...WHITE_TO_MOVE });

    // ASSERTIONS
    expect(playSound).toHaveBeenCalledTimes(1);
  });

  it('spielt stumm keinen Ton, markiert den verborgenen Tab aber trotzdem', () => {
    // ARRANGE
    localStorage.setItem('chesstopia.soundMuted', 'true');
    setHidden(true);
    const { rerender } = renderHook((args: Args) => useGameFeedback(args), {
      initialProps: { ...WHITE_TO_MOVE, moveCount: 1, sideToMove: 'b' },
    });

    // ACT
    rerender(WHITE_TO_MOVE);

    // ASSERTIONS
    expect(playSound).not.toHaveBeenCalled();
    expect(document.title).toBe('● Du bist am Zug · Chesstopia');
  });

  it('nimmt die Markierung zurück, sobald der Tab sichtbar wird', () => {
    // ARRANGE
    setHidden(true);
    const { rerender } = renderHook((args: Args) => useGameFeedback(args), {
      initialProps: { ...WHITE_TO_MOVE, moveCount: 1, sideToMove: 'b' },
    });
    rerender(WHITE_TO_MOVE);

    // ACT
    act(() => {
      setHidden(false);
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // ASSERTIONS
    expect(document.title).toBe('Du bist am Zug · Chesstopia');
  });

  it('markiert den sichtbaren Tab nicht', () => {
    // ARRANGE
    const { rerender } = renderHook((args: Args) => useGameFeedback(args), {
      initialProps: { ...WHITE_TO_MOVE, moveCount: 1, sideToMove: 'b' },
    });

    // ACT
    rerender(WHITE_TO_MOVE);

    // ASSERTIONS
    expect(document.title.startsWith('●')).toBe(false);
  });

  it('lässt den König bei Schach wackeln und beim nächsten Zug ohne Schach nicht mehr', () => {
    // ARRANGE
    const { result, rerender } = renderHook((args: Args) => useGameFeedback(args), {
      initialProps: { ...WHITE_TO_MOVE, moveCount: 1, sideToMove: 'b' },
    });

    // ACT
    rerender({ ...WHITE_TO_MOVE, inCheck: true });
    const duringCheck = result.current.animateCheck;
    rerender({ ...WHITE_TO_MOVE, moveCount: 3, sideToMove: 'b' });

    // ASSERTIONS
    expect(duringCheck).toBe(true);
    expect(playSound).toHaveBeenCalledWith(STANDARD.sounds['check-received']);
    expect(result.current.animateCheck).toBe(false);
  });

  it('lässt den König beim ersten Laden im Schach nicht wackeln', () => {
    // ACT
    const { result } = renderHook(() => useGameFeedback({ ...WHITE_TO_MOVE, inCheck: true }));

    // ASSERTIONS
    expect(result.current.animateCheck).toBe(false);
    expect(document.title).toBe('Schach! · Chesstopia');
  });

  it('setzt beim Verlassen den Basistitel', () => {
    // ARRANGE
    const { unmount } = renderHook(() => useGameFeedback(WHITE_TO_MOVE));

    // ACT
    unmount();

    // ASSERTIONS
    expect(document.title).toBe('Chesstopia');
  });
});

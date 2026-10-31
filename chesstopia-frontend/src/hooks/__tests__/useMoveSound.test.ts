import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const { playSound } = vi.hoisted(() => ({ playSound: vi.fn() }));
vi.mock('@/lib/sound', () => ({ playSound }));

import { useMoveSound } from '../useMoveSound';
import { STANDARD } from '@/components/sound/theme/soundTheme';
import type { FeedbackEvent } from '@/lib/feedback';
import { setMuted } from '@/lib/soundSettings';

type Props = { event: FeedbackEvent | null; seq: number };

const render = (initialProps: Props) =>
  renderHook(({ event, seq }: Props) => useMoveSound(event, seq), { initialProps });

describe('useMoveSound', () => {
  beforeEach(() => {
    localStorage.clear();
    playSound.mockReset();
  });

  it('spielt bei seq 0 keinen Ton', () => {
    // ACT
    render({ event: 'move', seq: 0 });

    // ASSERTIONS
    expect(playSound).not.toHaveBeenCalled();
  });

  it('spielt den Ton des Ereignisses bei neuem seq', () => {
    // ARRANGE
    const { rerender } = render({ event: null, seq: 0 });

    // ACT
    rerender({ event: 'check-received', seq: 1 });

    // ASSERTIONS
    expect(playSound).toHaveBeenCalledExactlyOnceWith(STANDARD.sounds['check-received']);
  });

  it('spielt bei gleichem seq keinen zweiten Ton', () => {
    // ARRANGE
    const { rerender } = render({ event: null, seq: 0 });
    rerender({ event: 'move', seq: 1 });

    // ACT
    rerender({ event: 'move', seq: 1 });

    // ASSERTIONS
    expect(playSound).toHaveBeenCalledTimes(1);
  });

  it('spielt stumm keinen Ton', () => {
    // ARRANGE
    setMuted(true);
    const { rerender } = render({ event: null, seq: 0 });

    // ACT
    rerender({ event: 'move', seq: 1 });

    // ASSERTIONS
    expect(playSound).not.toHaveBeenCalled();
  });

  it('spielt nach dem Lautschalten nichts nach', () => {
    // ARRANGE
    setMuted(true);
    const { rerender } = render({ event: null, seq: 0 });
    rerender({ event: 'move', seq: 1 });

    // ACT
    act(() => setMuted(false));

    // ASSERTIONS
    expect(playSound).not.toHaveBeenCalled();
  });

  it('spielt bei event null keinen Ton', () => {
    // ARRANGE
    const { rerender } = render({ event: null, seq: 0 });

    // ACT
    rerender({ event: null, seq: 1 });

    // ASSERTIONS
    expect(playSound).not.toHaveBeenCalled();
  });
});

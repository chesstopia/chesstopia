import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTabTitle } from '../useTabTitle';

type Props = { title: string; attentionSeq: number };

const TURN = 'Du bist am Zug · Chesstopia';

const render = (initialProps: Props) =>
  renderHook(({ title, attentionSeq }: Props) => useTabTitle(title, attentionSeq), { initialProps });

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
}

describe('useTabTitle', () => {
  beforeEach(() => {
    setHidden(false);
    document.title = 'Chesstopia';
  });

  afterEach(() => setHidden(false));

  it('setzt den Titel', () => {
    // ACT
    render({ title: TURN, attentionSeq: 0 });

    // ASSERTIONS
    expect(document.title).toBe(TURN);
  });

  it('markiert den verborgenen Tab bei steigendem attentionSeq', () => {
    // ARRANGE
    setHidden(true);
    const { rerender } = render({ title: 'Chesstopia', attentionSeq: 0 });

    // ACT
    rerender({ title: TURN, attentionSeq: 1 });

    // ASSERTIONS
    expect(document.title).toBe('● ' + TURN);
  });

  it('markiert den sichtbaren Tab nicht', () => {
    // ARRANGE
    const { rerender } = render({ title: 'Chesstopia', attentionSeq: 0 });

    // ACT
    rerender({ title: TURN, attentionSeq: 1 });

    // ASSERTIONS
    expect(document.title).toBe(TURN);
  });

  it('nimmt die Markierung zurück, sobald der Tab sichtbar wird', () => {
    // ARRANGE
    setHidden(true);
    const { rerender } = render({ title: 'Chesstopia', attentionSeq: 0 });
    rerender({ title: TURN, attentionSeq: 1 });

    // ACT
    act(() => {
      setHidden(false);
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // ASSERTIONS
    expect(document.title).toBe(TURN);
  });

  it('markiert bei unverändertem attentionSeq nicht erneut, auch wenn sich der Titel ändert', () => {
    // ARRANGE
    const { rerender } = render({ title: 'Chesstopia', attentionSeq: 0 });
    rerender({ title: TURN, attentionSeq: 1 });
    setHidden(true);

    // ACT
    rerender({ title: 'Schach! · Chesstopia', attentionSeq: 1 });

    // ASSERTIONS
    expect(document.title).toBe('Schach! · Chesstopia');
  });

  it('setzt beim Unmount den Basistitel', () => {
    // ARRANGE
    const { unmount } = render({ title: TURN, attentionSeq: 0 });

    // ACT
    unmount();

    // ASSERTIONS
    expect(document.title).toBe('Chesstopia');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isMuted, setMuted, subscribeMuted } from '../soundSettings';

describe('soundSettings', () => {
  beforeEach(() => localStorage.clear());

  it('ist ohne gespeicherte Einstellung nicht stumm', () => {
    // ACT & ASSERTIONS
    expect(isMuted()).toBe(false);
  });

  it('speichert die Stummschaltung im localStorage', () => {
    // ACT
    setMuted(true);

    // ASSERTIONS
    expect(isMuted()).toBe(true);
    expect(localStorage.getItem('chesstopia.soundMuted')).toBe('true');
  });

  it('subscribeMuted meldet setMuted und lässt sich abmelden', () => {
    // ARRANGE
    const listener = vi.fn();
    const unsubscribe = subscribeMuted(listener);

    // ACT
    setMuted(true);
    unsubscribe();
    setMuted(false);

    // ASSERTIONS
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

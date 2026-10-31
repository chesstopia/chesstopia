import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { isMuted, setMuted, useSoundMuted } from '../soundSettings';

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

  it('der Hook folgt dem Setter', () => {
    // ARRANGE
    const { result } = renderHook(() => useSoundMuted());

    // ACT
    act(() => result.current[1](true));

    // ASSERTIONS
    expect(result.current[0]).toBe(true);
  });

  it('der Hook folgt einer Änderung von anderer Stelle', () => {
    // ARRANGE
    const { result } = renderHook(() => useSoundMuted());

    // ACT
    act(() => setMuted(true));

    // ASSERTIONS
    expect(result.current[0]).toBe(true);
  });
});

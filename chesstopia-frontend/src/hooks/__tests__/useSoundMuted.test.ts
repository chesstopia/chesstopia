import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { setMuted } from '@/lib/soundSettings';
import { useSoundMuted } from '../useSoundMuted';

describe('useSoundMuted', () => {
  beforeEach(() => localStorage.clear());

  it('folgt dem Setter', () => {
    // ARRANGE
    const { result } = renderHook(() => useSoundMuted());

    // ACT
    act(() => result.current[1](true));

    // ASSERTIONS
    expect(result.current[0]).toBe(true);
  });

  it('folgt einer Änderung von anderer Stelle', () => {
    // ARRANGE
    const { result } = renderHook(() => useSoundMuted());

    // ACT
    act(() => setMuted(true));

    // ASSERTIONS
    expect(result.current[0]).toBe(true);
  });
});

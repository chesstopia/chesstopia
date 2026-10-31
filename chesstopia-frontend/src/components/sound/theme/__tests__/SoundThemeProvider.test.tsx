import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { SoundThemeProvider, useSoundTheme } from '../SoundThemeProvider';
import { STANDARD, type SoundTheme } from '../soundTheme';

describe('SoundThemeProvider', () => {
  it('liefert ohne Provider das Theme Standard mit allen sechs Tönen', () => {
    // ACT
    const { result } = renderHook(() => useSoundTheme());

    // ASSERTIONS
    expect(result.current.id).toBe('standard');
    expect(Object.keys(result.current.sounds).sort()).toEqual(
      ['check-given', 'check-received', 'draw', 'loss', 'move', 'win'],
    );
  });

  it('ein eigenes Theme ersetzt einen Ton', () => {
    // ARRANGE
    const theme: SoundTheme = { ...STANDARD, id: 'test', sounds: { ...STANDARD.sounds, move: '/x/move.ogg' } };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SoundThemeProvider theme={theme}>{children}</SoundThemeProvider>
    );

    // ACT
    const { result } = renderHook(() => useSoundTheme(), { wrapper });

    // ASSERTIONS
    expect(result.current.sounds.move).toBe('/x/move.ogg');
    expect(result.current.sounds.win).toBe(STANDARD.sounds.win);
  });
});

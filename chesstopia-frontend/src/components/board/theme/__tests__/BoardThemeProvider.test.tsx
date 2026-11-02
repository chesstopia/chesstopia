import { describe, expect, it } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { Chessboard } from '../../Chessboard';
import { BoardThemeProvider, useBoardTheme } from '../BoardThemeProvider';
import { FLACH, type BoardTheme } from '../boardTheme';
import type { Board } from '@/lib/position';

const TEST_THEME: BoardTheme = {
  ...FLACH,
  id: 'test',
  name: 'Test',
  pieces: { ...FLACH.pieces, wK: '/x/wK.svg' },
  colors: { ...FLACH.colors, lightSquare: 'rgb(1, 2, 3)' },
};

// Reihe 8 zuerst; weißer König auf e1, e2 bleibt leer.
const KING_BOARD: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
KING_BOARD[7][4] = 'wK';

describe('BoardThemeProvider', () => {
  it('liefert ohne Provider das Theme Flach', () => {
    // ACT
    const { result } = renderHook(() => useBoardTheme());

    // ASSERTIONS
    expect(result.current.id).toBe('flach');
    expect(Object.keys(result.current.pieces)).toHaveLength(12);
  });

  it('ein eigenes Theme ersetzt Figuren und Farben', () => {
    // ACT
    const { container } = render(
      <BoardThemeProvider theme={TEST_THEME}>
        <Chessboard board={KING_BOARD} />
      </BoardThemeProvider>,
    );

    // ASSERTIONS
    expect(container.querySelector('[data-piece="wK"]')?.getAttribute('src')).toMatch(/\/x\/wK\.svg$/);
    const e2 = container.querySelector<HTMLElement>('[data-square="e2"]');
    expect(e2?.style.backgroundColor).toBe(TEST_THEME.colors.lightSquare);
  });

  it('ein eigenes Theme bestimmt die Farbe des Schach-Rahmens', () => {
    // ARRANGE
    const theme: BoardTheme = {
      ...FLACH,
      markers: { ...FLACH.markers, check: { color: 'rgb(1, 2, 3)', width: '5px' } },
    };

    // ACT
    const { container } = render(
      <BoardThemeProvider theme={theme}>
        <Chessboard board={KING_BOARD} kingMarker={{ square: 'e1', kind: 'check' }} />
      </BoardThemeProvider>,
    );

    // ASSERTIONS
    const e1 = container.querySelector<HTMLElement>('[data-square="e1"]');
    expect(e1?.style.boxShadow).toContain('rgb(1, 2, 3)');
    expect(e1?.style.boxShadow).toContain('5px');
  });
});

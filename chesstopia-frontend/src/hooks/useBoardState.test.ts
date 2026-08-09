import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// vi.mock wird über die Importe gehoben — die Referenz muss mitwandern,
// sonst steht sie zur Fabrikzeit in der temporalen Totzone.
const { getBoard } = vi.hoisted(() => ({ getBoard: vi.fn() }));

vi.mock('@chesstopia/openapi-client', () => ({
  GameApi: class {
    getBoard = getBoard;
  },
}));

const { useBoardState } = await import('./useBoardState');

describe('useBoardState', () => {
  beforeEach(() => {
    getBoard.mockReset();
  });

  it('startet ladend und ohne Brett', () => {
    getBoard.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useBoardState());

    expect(result.current.loading).toBe(true);
    expect(result.current.board).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('übersetzt die FEN der Antwort in ein Brett', async () => {
    getBoard.mockResolvedValue({
      data: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
    });

    const { result } = renderHook(() => useBoardState());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.board).toHaveLength(8);
    expect(result.current.board?.[0]).toEqual([
      'bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR',
    ]);
    expect(result.current.error).toBeNull();
  });

  it('hält den Fehler fest und lässt das Brett leer', async () => {
    getBoard.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useBoardState());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('network down');
    expect(result.current.board).toBeNull();
  });

  it('verpackt einen geworfenen Nicht-Fehler in ein Error-Objekt', async () => {
    // Randfall: Axios wirft nicht immer ein Error — der Hook fängt das ab,
    // und ohne Test bleibt genau dieser Zweig unbelegt.
    getBoard.mockRejectedValue('kaputt');

    const { result } = renderHook(() => useBoardState());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('kaputt');
  });
});

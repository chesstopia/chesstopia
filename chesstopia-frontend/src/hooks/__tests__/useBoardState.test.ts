import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { createGame, playMove } = vi.hoisted(() => ({ createGame: vi.fn(), playMove: vi.fn() }));
vi.mock('@chesstopia/openapi-client', () => ({
  Configuration: class {},
  GameApi: class { createGame = createGame; playMove = playMove; getGame = vi.fn(); },
}));

const { isLegalMove } = vi.hoisted(() => ({ isLegalMove: vi.fn() }));
vi.mock('@/lib/engine', () => ({ isLegalMove }));

import { useBoardState } from '../useBoardState';
import type { Position } from '@chesstopia/openapi-client';

const START: Position = {
  board: [{ square: { file: 'E', rank: 'TWO' }, piece: { type: 'PAWN', color: 'WHITE' } }],
  sideToMove: 'WHITE',
  castlingRights: { whiteKingSide: true, whiteQueenSide: true, blackKingSide: true, blackQueenSide: true },
  halfmoveClock: 0, fullmoveNumber: 1,
};
const gameResponse = (position: Position) => ({
  data: { id: 'p-1', position, status: 'ONGOING', endReason: null, moveCount: 0 },
});

describe('useBoardState', () => {
  beforeEach(() => {
    createGame.mockReset();
    playMove.mockReset();
    isLegalMove.mockReset();
    isLegalMove.mockReturnValue(true);
    createGame.mockResolvedValue(gameResponse(START));
  });

  it('lädt beim Start eine Partie und stellt das Brett', async () => {
    // ACT
    const { result } = renderHook(() => useBoardState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ASSERTIONS
    expect(result.current.board?.[6][4]).toBe('wP'); // e2
    expect(result.current.sideToMove).toBe('w');
  });

  it('schickt from/to strukturiert an die API', async () => {
    // ARRANGE
    playMove.mockResolvedValue(gameResponse(START));
    const { result } = renderHook(() => useBoardState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    await act(() => result.current.playMove('e2', 'e4'));

    // ASSERTIONS
    expect(playMove).toHaveBeenCalledWith('p-1', {
      from: { file: 'E', rank: 'TWO' }, to: { file: 'E', rank: 'FOUR' }, promotion: undefined,
    });
  });

  it('wählt bei einem Bauern auf der Grundreihe die Dame', async () => {
    // ARRANGE
    const promo: Position = {
      ...START,
      board: [{ square: { file: 'E', rank: 'SEVEN' }, piece: { type: 'PAWN', color: 'WHITE' } }],
    };
    createGame.mockResolvedValue(gameResponse(promo));
    playMove.mockResolvedValue(gameResponse(promo));
    const { result } = renderHook(() => useBoardState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    await act(() => result.current.playMove('e7', 'e8'));

    // ASSERTIONS
    expect(playMove).toHaveBeenCalledWith('p-1', expect.objectContaining({ promotion: 'QUEEN' }));
  });

  it('verpackt einen als Ausnahme gereichten Nicht-Error in ein Error-Objekt', async () => {
    // ARRANGE
    // Axios liefert nicht immer ein Error — asError fängt das ab, sonst bleibt
    // genau dieser Zweig unbelegt.
    createGame.mockRejectedValue('kaputt');

    // ACT
    const { result } = renderHook(() => useBoardState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ASSERTIONS
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('kaputt');
  });

  it('hält den Fehler fest und lässt das Brett leer, wenn das Anlegen scheitert', async () => {
    // ARRANGE
    createGame.mockRejectedValue(new Error('network down'));

    // ACT
    const { result } = renderHook(() => useBoardState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ASSERTIONS
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('network down');
    expect(result.current.board).toBeNull();
  });

  it('hält die Stellung, wenn das Backend den Zug ablehnt', async () => {
    // ARRANGE
    playMove.mockRejectedValue(new Error('Der Zug ist nicht ausführbar'));
    const { result } = renderHook(() => useBoardState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    await act(() => result.current.playMove('e2', 'e4'));

    // ASSERTIONS
    expect(result.current.error?.message).toBe('Der Zug ist nicht ausführbar');
    expect(result.current.pending).toBe(false);
    expect(result.current.sideToMove).toBe('w');
    expect(result.current.board?.[6][4]).toBe('wP'); // e2 unverändert
  });

  it('spielt keinen Zug, solange keine Partie angelegt ist', async () => {
    // ARRANGE
    createGame.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useBoardState());

    // ACT
    await act(() => result.current.playMove('e2', 'e4'));

    // ASSERTIONS
    expect(playMove).not.toHaveBeenCalled();
  });

  it('schickt einen von der Engine als illegal gemeldeten Zug nicht ans Backend', async () => {
    // ARRANGE
    isLegalMove.mockReturnValue(false);
    const { result } = renderHook(() => useBoardState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    await act(() => result.current.playMove('e2', 'e4'));

    // ASSERTIONS
    expect(playMove).not.toHaveBeenCalled();
    expect(result.current.error?.message).toMatch(/legal/i);
    expect(result.current.board?.[6][4]).toBe('wP');
  });

  it('übernimmt Status und Endgrund aus der Zug-Antwort', async () => {
    // ARRANGE
    playMove.mockResolvedValue({
      data: { id: 'p-1', position: START, status: 'WHITE_WON', endReason: 'CHECKMATE', moveCount: 1 },
    });
    const { result } = renderHook(() => useBoardState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    await act(() => result.current.playMove('e2', 'e4'));

    // ASSERTIONS
    expect(result.current.status).toBe('WHITE_WON');
    expect(result.current.endReason).toBe('CHECKMATE');
  });

  it('spielt keinen Zug mehr, wenn die Partie beendet ist', async () => {
    // ARRANGE
    createGame.mockResolvedValue({
      data: { id: 'p-1', position: START, status: 'DRAW', endReason: 'STALEMATE', moveCount: 0 },
    });
    const { result } = renderHook(() => useBoardState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    await act(() => result.current.playMove('e2', 'e4'));

    // ASSERTIONS
    expect(playMove).not.toHaveBeenCalled();
  });
});

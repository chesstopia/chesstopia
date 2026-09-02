import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { createGame, playMove } = vi.hoisted(() => ({ createGame: vi.fn(), playMove: vi.fn() }));
vi.mock('@chesstopia/openapi-client', () => ({
  Configuration: class {},
  GameApi: class { createGame = createGame; playMove = playMove; getGame = vi.fn(); },
}));

import { useBoardState } from './useBoardState';
import type { Position } from '@chesstopia/openapi-client';

const START: Position = {
  board: [{ square: { file: 'E', rank: 'TWO' }, piece: { type: 'PAWN', color: 'WHITE' } }],
  sideToMove: 'WHITE',
  castlingRights: { whiteKingSide: true, whiteQueenSide: true, blackKingSide: true, blackQueenSide: true },
  halfmoveClock: 0, fullmoveNumber: 1,
};
const gameResponse = (position: Position) => ({ data: { id: 'p-1', position, status: 'ONGOING', moveCount: 0 } });

describe('useBoardState', () => {
  beforeEach(() => {
    createGame.mockReset();
    playMove.mockReset();
    createGame.mockResolvedValue(gameResponse(START));
  });

  it('lädt beim Start eine Partie und stellt das Brett', async () => {
    const { result } = renderHook(() => useBoardState());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.board?.[6][4]).toBe('wP'); // e2
    expect(result.current.sideToMove).toBe('w');
  });

  it('schickt from/to strukturiert an die API', async () => {
    playMove.mockResolvedValue(gameResponse(START));
    const { result } = renderHook(() => useBoardState());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.playMove('e2', 'e4'));
    expect(playMove).toHaveBeenCalledWith('p-1', {
      from: { file: 'E', rank: 'TWO' }, to: { file: 'E', rank: 'FOUR' }, promotion: undefined,
    });
  });

  it('wählt bei einem Bauern auf der Grundreihe die Dame', async () => {
    const promo: Position = {
      ...START,
      board: [{ square: { file: 'E', rank: 'SEVEN' }, piece: { type: 'PAWN', color: 'WHITE' } }],
    };
    createGame.mockResolvedValue(gameResponse(promo));
    playMove.mockResolvedValue(gameResponse(promo));
    const { result } = renderHook(() => useBoardState());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.playMove('e7', 'e8'));
    expect(playMove).toHaveBeenCalledWith('p-1', expect.objectContaining({ promotion: 'QUEEN' }));
  });
});

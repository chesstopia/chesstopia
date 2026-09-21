import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { getGame, playMove } = vi.hoisted(() => ({ getGame: vi.fn(), playMove: vi.fn() }));
vi.mock('@chesstopia/openapi-client', () => ({
  Configuration: class {},
  GameApi: class {
    getGame = getGame;
    playMove = playMove;
  },
}));

const { isLegalMove } = vi.hoisted(() => ({ isLegalMove: vi.fn() }));
vi.mock('@/lib/engine', () => ({ isLegalMove }));

const { subscribeToGame, receiveMessage } = vi.hoisted(() => {
  let handler: ((raw: string) => void) | null = null;
  return {
    subscribeToGame: vi.fn((_gameId: string, onMessage: (raw: string) => void) => {
      handler = onMessage;
      return () => {
        handler = null;
      };
    }),
    receiveMessage: (raw: string) => handler?.(raw),
  };
});
vi.mock('@/lib/stomp', () => ({ subscribeToGame }));

import { useGameState } from '../useGameState';
import { addOwnedGame } from '@/lib/gameStorage';
import type { Position } from '@chesstopia/openapi-client';

const START: Position = {
  board: [{ square: { file: 'E', rank: 'TWO' }, piece: { type: 'PAWN', color: 'WHITE' } }],
  sideToMove: 'WHITE',
  castlingRights: { whiteKingSide: true, whiteQueenSide: true, blackKingSide: true, blackQueenSide: true },
  halfmoveClock: 0,
  fullmoveNumber: 1,
};
const gameResponse = (position: Position, moveCount = 0) => ({
  data: { id: 'g-1', position, status: 'ONGOING', endReason: null, moveCount },
});

describe('useGameState', () => {
  beforeEach(() => {
    localStorage.clear();
    getGame.mockReset();
    playMove.mockReset();
    isLegalMove.mockReset();
    isLegalMove.mockReturnValue(true);
    subscribeToGame.mockClear();
    getGame.mockResolvedValue(gameResponse(START));
  });

  it('lädt die Partie über GET statt sie anzulegen', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');

    // ACT
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ASSERTIONS
    expect(getGame).toHaveBeenCalledWith('g-1');
    expect(result.current.board?.[6][4]).toBe('wP');
  });

  it('erkennt den Ersteller anhand des Owner-Eintrags als Weiß', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');

    // ACT
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ASSERTIONS
    expect(result.current.role).toBe('w');
  });

  it('erkennt eine unbekannte Partie mit Invite-Parameter als Schwarz und merkt es sich', async () => {
    // ACT
    const { result } = renderHook(() => useGameState('g-2', 'invite-tok'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ASSERTIONS
    expect(result.current.role).toBe('b');
    expect(result.current.entry).toEqual({ gameId: 'g-2', role: 'INVITED', inviteToken: 'invite-tok' });
  });

  it('überschreibt einen bestehenden Owner-Eintrag nicht mit einem fremden Invite-Parameter aus der URL', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');

    // ACT
    const { result } = renderHook(() => useGameState('g-1', 'fremdes-token'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ASSERTIONS
    expect(result.current.role).toBe('w');
    const stored = JSON.parse(localStorage.getItem('chesstopia.games') ?? '[]');
    expect(stored).toEqual([
      { gameId: 'g-1', role: 'OWNER', ownerToken: 'owner-tok', inviteToken: 'invite-tok' },
    ]);
  });

  it('ist Zuschauer ohne Eintrag und ohne Invite-Parameter', async () => {
    // ACT
    const { result } = renderHook(() => useGameState('g-3', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ASSERTIONS
    expect(result.current.role).toBeNull();
  });

  it('schickt from/to strukturiert und das Owner-Token als Header beim Ziehen', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');
    playMove.mockResolvedValue(gameResponse(START, 1));
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    await act(() => result.current.playMove('e2', 'e4'));

    // ASSERTIONS
    expect(playMove).toHaveBeenCalledWith(
      'g-1',
      { from: { file: 'E', rank: 'TWO' }, to: { file: 'E', rank: 'FOUR' }, promotion: undefined },
      'owner-tok',
    );
  });

  it('wählt bei einem Bauern auf der Grundreihe die Dame', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');
    const promo: Position = {
      ...START,
      board: [{ square: { file: 'E', rank: 'SEVEN' }, piece: { type: 'PAWN', color: 'WHITE' } }],
    };
    getGame.mockResolvedValue(gameResponse(promo));
    playMove.mockResolvedValue(gameResponse(promo, 1));
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    await act(() => result.current.playMove('e7', 'e8'));

    // ASSERTIONS
    expect(playMove).toHaveBeenCalledWith('g-1', expect.objectContaining({ promotion: 'QUEEN' }), expect.anything());
  });

  it('schickt einen von der Engine als illegal gemeldeten Zug nicht ans Backend', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');
    isLegalMove.mockReturnValue(false);
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    await act(() => result.current.playMove('e2', 'e4'));

    // ASSERTIONS
    expect(playMove).not.toHaveBeenCalled();
    expect(result.current.error?.message).toMatch(/legal/i);
  });

  it('hält die Stellung, wenn das Backend den Zug ablehnt', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');
    playMove.mockRejectedValue(new Error('Der Zug ist nicht ausführbar'));
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    await act(() => result.current.playMove('e2', 'e4'));

    // ASSERTIONS
    expect(result.current.error?.message).toBe('Der Zug ist nicht ausführbar');
    expect(result.current.pending).toBe(false);
    expect(result.current.board?.[6][4]).toBe('wP');
  });

  it('spielt keinen Zug ohne eigenes Token (Zuschauer)', async () => {
    // ARRANGE — kein Eintrag, kein Invite-Parameter: Zuschauer.
    const { result } = renderHook(() => useGameState('g-3', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    await act(() => result.current.playMove('e2', 'e4'));

    // ASSERTIONS
    expect(playMove).not.toHaveBeenCalled();
  });

  it('spielt keinen Zug mehr, wenn die Partie beendet ist', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');
    getGame.mockResolvedValue({
      data: { id: 'g-1', position: START, status: 'DRAW', endReason: 'STALEMATE', moveCount: 0 },
    });
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    await act(() => result.current.playMove('e2', 'e4'));

    // ASSERTIONS
    expect(playMove).not.toHaveBeenCalled();
  });

  it('übernimmt eine über WS eintreffende Stellung', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const neuer: Position = { ...START, sideToMove: 'BLACK' };

    // ACT
    act(() => receiveMessage(JSON.stringify(gameResponse(neuer, 1).data)));

    // ASSERTIONS
    await waitFor(() => expect(result.current.sideToMove).toBe('b'));
  });

  it('verwirft eine veraltete WS-Nachricht, die nach einer neueren eintrifft', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const neuer: Position = { ...START, sideToMove: 'BLACK' };

    // ACT — neuere Nachricht zuerst, dann eine ältere hinterher
    act(() => receiveMessage(JSON.stringify(gameResponse(neuer, 2).data)));
    await waitFor(() => expect(result.current.sideToMove).toBe('b'));
    act(() => receiveMessage(JSON.stringify(gameResponse(START, 1).data)));

    // ASSERTIONS
    expect(result.current.sideToMove).toBe('b');
  });

  it('trennt die WS-Verbindung beim Unmount', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');
    const unsubscribe = vi.fn();
    subscribeToGame.mockReturnValueOnce(unsubscribe);
    const { result, unmount } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    unmount();

    // ASSERTIONS
    expect(unsubscribe).toHaveBeenCalled();
  });
});

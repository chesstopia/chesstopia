import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { getGame, playMove, listMoves } = vi.hoisted(() => ({
  getGame: vi.fn(),
  playMove: vi.fn(),
  listMoves: vi.fn(),
}));
vi.mock('@chesstopia/openapi-client', () => ({
  Configuration: class {},
  GameApi: class {
    getGame = getGame;
    playMove = playMove;
    listMoves = listMoves;
  },
}));

const { isLegalMove } = vi.hoisted(() => ({ isLegalMove: vi.fn() }));
vi.mock('@/lib/engine', () => ({ isLegalMove }));

const { subscribeToGame, receiveMessage, receiveDeleted } = vi.hoisted(() => {
  type Handlers = { onUpdate: (raw: string) => void; onDeleted: () => void };
  let handlers: Handlers | null = null;
  return {
    subscribeToGame: vi.fn((_gameId: string, h: Handlers) => {
      handlers = h;
      return () => {
        handlers = null;
      };
    }),
    receiveMessage: (raw: string) => handlers?.onUpdate(raw),
    receiveDeleted: () => handlers?.onDeleted(),
  };
});
vi.mock('@/lib/stomp', () => ({ subscribeToGame }));

import { useGameState } from '../useGameState';
import { addOwnedGame, findGame } from '@/lib/gameStorage';
import type { Position } from '@chesstopia/openapi-client';

const START: Position = {
  board: [{ square: { file: 'E', rank: 'TWO' }, piece: { type: 'PAWN', color: 'WHITE' } }],
  sideToMove: 'WHITE',
  castlingRights: { whiteKingSide: true, whiteQueenSide: true, blackKingSide: true, blackQueenSide: true },
  halfmoveClock: 0,
  fullmoveNumber: 1,
};
const sq = (file: string, rank: string) => ({ file, rank });
const moveRecord = (n: number, from: [string, string], to: [string, string]) => ({
  moveNumber: n,
  move: { from: sq(...from), to: sq(...to) },
  positionAfter: START,
  playedAt: '2026-01-01T00:00:00Z',
});
const E2E4 = moveRecord(1, ['E', 'TWO'], ['E', 'FOUR']);
const E7E5 = moveRecord(2, ['E', 'SEVEN'], ['E', 'FIVE']);
const E1E2 = moveRecord(3, ['E', 'ONE'], ['E', 'TWO']);
const gameResponse = (position: Position, moveCount = 0, checkState = 'NO_CHECK') => ({
  data: { id: 'g-1', position, status: 'ONGOING', endReason: null, checkState, moveCount },
});

describe('useGameState', () => {
  beforeEach(() => {
    localStorage.clear();
    getGame.mockReset();
    playMove.mockReset();
    listMoves.mockReset();
    listMoves.mockResolvedValue({ data: { moves: [] } });
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

  it('markiert die Partie als gelöscht, wenn die Lösch-Nachricht eintrifft, und entfernt den Eintrag', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    act(() => receiveDeleted());

    // ASSERTIONS
    expect(result.current.deleted).toBe(true);
    expect(findGame('g-1')).toBeUndefined();
  });

  it('markiert die Partie als gelöscht, wenn getGame 404 liefert', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');
    getGame.mockRejectedValue({ response: { status: 404 } });

    // ACT
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ASSERTIONS
    expect(result.current.deleted).toBe(true);
    expect(result.current.error).toBeNull();
    expect(findGame('g-1')).toBeUndefined();
  });

  it('markiert die Partie als gelöscht, wenn playMove 404 liefert', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');
    playMove.mockRejectedValue({ response: { status: 404 } });
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    await act(() => result.current.playMove('e2', 'e4'));

    // ASSERTIONS
    expect(result.current.deleted).toBe(true);
    expect(result.current.error).toBeNull();
    expect(findGame('g-1')).toBeUndefined();
  });

  it('spielt keinen Zug mehr nach dem Löschen', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => receiveDeleted());

    // ACT
    await act(() => result.current.playMove('e2', 'e4'));

    // ASSERTIONS
    expect(playMove).not.toHaveBeenCalled();
  });

  it('ein anderer getGame-Fehler bleibt ein Fehler', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'owner-tok', 'invite-tok');
    getGame.mockRejectedValue({ response: { status: 500 } });

    // ACT
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ASSERTIONS
    expect(result.current.error).not.toBeNull();
    expect(result.current.deleted).toBe(false);
    expect(findGame('g-1')).toBeDefined();
  });

  it('lädt die Zughistorie beim Öffnen', async () => {
    // ARRANGE
    getGame.mockResolvedValue(gameResponse(START, 2));
    listMoves.mockResolvedValue({ data: { moves: [E2E4, E7E5] } });

    // ACT
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.moves).toHaveLength(2));

    // ASSERTIONS
    expect(listMoves).toHaveBeenCalledWith('g-1');
    expect(result.current.lastMove).toEqual({ from: 'e7', to: 'e5' });
  });

  it('hat ohne Züge keine Historie und keinen letzten Zug', async () => {
    // ACT
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ASSERTIONS
    expect(listMoves).not.toHaveBeenCalled();
    expect(result.current.moves).toEqual([]);
    expect(result.current.lastMove).toBeNull();
  });

  it('lädt die Historie nach, wenn moveCount wächst', async () => {
    // ARRANGE
    getGame.mockResolvedValue(gameResponse(START, 2));
    listMoves.mockResolvedValue({ data: { moves: [E2E4, E7E5] } });
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.moves).toHaveLength(2));
    listMoves.mockResolvedValue({ data: { moves: [E2E4, E7E5, E1E2] } });

    // ACT
    act(() => receiveMessage(JSON.stringify(gameResponse(START, 3).data)));

    // ASSERTIONS
    await waitFor(() => expect(result.current.moves).toHaveLength(3));
    expect(listMoves).toHaveBeenCalledTimes(2);
    expect(result.current.lastMove).toEqual({ from: 'e1', to: 'e2' });
  });

  it('eine verspätete listMoves-Antwort mit weniger Zügen ersetzt keine längere Liste', async () => {
    // ARRANGE — die erste Antwort (2 Züge) hängt, die zweite (3 Züge) kommt zuerst.
    let resolveSlow: (v: unknown) => void = () => {};
    getGame.mockResolvedValue(gameResponse(START, 2));
    listMoves.mockReturnValueOnce(new Promise((r) => (resolveSlow = r)));
    listMoves.mockResolvedValueOnce({ data: { moves: [E2E4, E7E5, E1E2] } });
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(listMoves).toHaveBeenCalledTimes(1));

    // ACT
    act(() => receiveMessage(JSON.stringify(gameResponse(START, 3).data)));
    await waitFor(() => expect(result.current.moves).toHaveLength(3));
    await act(async () => resolveSlow({ data: { moves: [E2E4, E7E5] } }));

    // ASSERTIONS
    expect(result.current.moves).toHaveLength(3);
    expect(result.current.lastMove).toEqual({ from: 'e1', to: 'e2' });
  });

  it('übernimmt checkState und moveCount aus der geladenen Partie', async () => {
    // ARRANGE
    getGame.mockResolvedValue(gameResponse(START, 7, 'CHECK_WHITE'));

    // ACT
    const { result } = renderHook(() => useGameState('g-1', null));

    // ASSERTIONS
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.checkState).toBe('CHECK_WHITE');
    expect(result.current.inCheck).toBe(true);
    expect(result.current.moveCount).toBe(7);
  });

  it('übernimmt checkState aus einer WS-Nachricht', async () => {
    // ARRANGE
    const { result } = renderHook(() => useGameState('g-1', null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // ACT
    act(() => receiveMessage(JSON.stringify(gameResponse({ ...START, sideToMove: 'BLACK' }, 1, 'CHECK_BLACK').data)));

    // ASSERTIONS
    await waitFor(() => expect(result.current.checkState).toBe('CHECK_BLACK'));
  });

  it('meldet kein Schach, solange keine Partie geladen ist', () => {
    // ARRANGE
    getGame.mockReturnValue(new Promise(() => {}));

    // ACT
    const { result } = renderHook(() => useGameState('g-1', null));

    // ASSERTIONS
    expect(result.current.checkState).toBe('NO_CHECK');
    expect(result.current.inCheck).toBe(false);
  });
});

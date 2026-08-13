import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

// vi.mock wird über die Importe gehoben — die Referenz muss mitwandern,
// sonst steht sie zur Fabrikzeit in der temporalen Totzone.
const { createGame, playMove } = vi.hoisted(() => ({
  createGame: vi.fn(),
  playMove: vi.fn(),
}));

vi.mock('@chesstopia/openapi-client', () => ({
  GameApi: class {
    createGame = createGame;
    playMove = playMove;
  },
}));

const { useBoardState } = await import('./useBoardState');

const INITIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const AFTER_E2E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

function gameResponse(fen: string) {
  return { data: { id: 'p-1', fen, status: 'ONGOING', moveCount: 0 } };
}

/** Hook mit fertig angelegter Partie. */
async function renderReady() {
  createGame.mockResolvedValue(gameResponse(INITIAL));
  const rendered = renderHook(() => useBoardState());
  await waitFor(() => expect(rendered.result.current.loading).toBe(false));
  return rendered;
}

describe('useBoardState', () => {
  beforeEach(() => {
    createGame.mockReset();
    playMove.mockReset();
  });

  it('startet ladend und ohne Brett', () => {
    createGame.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useBoardState());

    expect(result.current.loading).toBe(true);
    expect(result.current.board).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('legt beim Mounten eine Partie an und übersetzt ihre FEN in ein Brett', async () => {
    const { result } = await renderReady();

    expect(createGame).toHaveBeenCalledOnce();
    expect(result.current.gameId).toBe('p-1');
    expect(result.current.sideToMove).toBe('w');
    expect(result.current.board).toHaveLength(8);
    expect(result.current.board?.[0]).toEqual([
      'bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR',
    ]);
    expect(result.current.error).toBeNull();
  });

  it('hält den Fehler fest und lässt das Brett leer', async () => {
    createGame.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useBoardState());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('network down');
    expect(result.current.board).toBeNull();
  });

  it('verpackt einen geworfenen Nicht-Fehler in ein Error-Objekt', async () => {
    // Randfall: Axios wirft nicht immer ein Error — der Hook fängt das ab,
    // und ohne Test bleibt genau dieser Zweig unbelegt.
    createGame.mockRejectedValue('kaputt');

    const { result } = renderHook(() => useBoardState());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('kaputt');
  });

  it('schickt den Zug als UCI und übernimmt die Antwortstellung', async () => {
    const { result } = await renderReady();
    playMove.mockResolvedValue(gameResponse(AFTER_E2E4));

    await act(() => result.current.playMove('e2', 'e4'));

    expect(playMove).toHaveBeenCalledWith('p-1', { uci: 'e2e4' });
    expect(result.current.sideToMove).toBe('b');
    expect(result.current.board?.[4][4]).toBe('wP');
  });

  it('hängt bei einer Bauernumwandlung eine Zielfigur an', async () => {
    // Ohne sie lehnt die Engine den Zug ab — die Oberfläche beantwortet die
    // Frage vorerst mit der Dame, statt sie zu stellen.
    createGame.mockResolvedValue(gameResponse('8/4P3/8/8/8/8/8/8 w - - 0 1'));
    const { result } = renderHook(() => useBoardState());
    await waitFor(() => expect(result.current.loading).toBe(false));
    playMove.mockResolvedValue(gameResponse('4Q3/8/8/8/8/8/8/8 b - - 0 1'));

    await act(() => result.current.playMove('e7', 'e8'));

    expect(playMove).toHaveBeenCalledWith('p-1', { uci: 'e7e8q' });
  });

  it('hängt keine Zielfigur an, wenn keine Umwandlung stattfindet', async () => {
    const { result } = await renderReady();
    playMove.mockResolvedValue(gameResponse(AFTER_E2E4));

    await act(() => result.current.playMove('b1', 'c3'));

    expect(playMove).toHaveBeenCalledWith('p-1', { uci: 'b1c3' });
  });

  it('hält die Stellung, wenn das Backend den Zug ablehnt', async () => {
    const { result } = await renderReady();
    playMove.mockRejectedValue(new Error('Der Zug ist nicht ausführbar'));

    await act(() => result.current.playMove('e2', 'e4'));

    expect(result.current.error?.message).toBe('Der Zug ist nicht ausführbar');
    expect(result.current.sideToMove).toBe('w');
    expect(result.current.board?.[6][4]).toBe('wP');
    expect(result.current.pending).toBe(false);
  });

  it('spielt keinen Zug, solange keine Partie angelegt ist', async () => {
    createGame.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useBoardState());

    await act(() => result.current.playMove('e2', 'e4'));

    expect(playMove).not.toHaveBeenCalled();
  });
});

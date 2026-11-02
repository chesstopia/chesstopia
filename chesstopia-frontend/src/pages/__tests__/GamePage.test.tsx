import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, RouterProvider, createMemoryRouter } from 'react-router';

const { useGameState } = vi.hoisted(() => ({ useGameState: vi.fn<typeof import('@/hooks/useGameState').useGameState>() }));
vi.mock('@/hooks/useGameState', () => ({ useGameState }));
vi.mock('@/lib/sound', () => ({ playSound: vi.fn() }));

// Das echte Brett, nur mit sichtbarem `disabled` umhüllt.
vi.mock('@/components/board/Chessboard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/board/Chessboard')>();
  return {
    Chessboard: (props: React.ComponentProps<typeof actual.Chessboard>) => (
      <div data-testid="board" data-disabled={String(props.disabled)}>
        <actual.Chessboard {...props} />
      </div>
    ),
  };
});

import type { GameState, LoadedGame } from '@/hooks/useGameState';
import { GamePage } from '../GamePage';

const BOARD = Array.from({ length: 8 }, () => Array(8).fill(null));

const LOADED: LoadedGame = {
  board: BOARD, sideToMove: 'w', status: 'ONGOING', endReason: null, checkState: 'NO_CHECK', moveCount: 0,
};

const BASE: GameState = {
  game: LOADED, role: null, inviteToken: null, loading: false, deleted: false, error: null, pending: false,
  playMove: vi.fn(), moves: [], lastMove: null, feedback: { event: null, seq: 0, attentionSeq: 0 },
  promotion: null, confirmPromotion: vi.fn(), cancelPromotion: vi.fn(),
};

const state = (over: Partial<GameState> = {}, game: Partial<LoadedGame> = {}): GameState => ({
  ...BASE, ...over, game: over.game === undefined ? { ...LOADED, ...game } : over.game,
});

const firstSquare = () => document.querySelector('[data-square]')?.getAttribute('data-square');

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GamePage', () => {
  beforeEach(() => {
    useGameState.mockReset();
  });

  it('reicht die offene Umwandlung ans Brett und meldet die Wahl zurück', async () => {
    // ARRANGE
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[1][4] = 'wP';
    const confirmPromotion = vi.fn();
    useGameState.mockReturnValue(state({ role: 'w', promotion: { from: 'e7', to: 'e8' }, confirmPromotion }, { board }));
    renderAt('/game/g-1');

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Springer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Umwandlung bestätigen' }));

    // ASSERTIONS
    expect(confirmPromotion).toHaveBeenCalledExactlyOnceWith('KNIGHT');
  });

  it('meldet den Abbruch der Umwandlung zurück', async () => {
    // ARRANGE
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    board[1][4] = 'wP';
    const cancelPromotion = vi.fn();
    useGameState.mockReturnValue(state({ role: 'w', promotion: { from: 'e7', to: 'e8' }, cancelPromotion }, { board }));
    renderAt('/game/g-1');

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Umwandlung abbrechen' }));

    // ASSERTIONS
    expect(cancelPromotion).toHaveBeenCalledTimes(1);
  });

  it('zeigt neutrale Seitennamen ohne Du/Gegner, wenn keine Rolle aufgelöst ist', () => {
    // ARRANGE
    useGameState.mockReturnValue(state());

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Weiß')).toBeInTheDocument();
    expect(screen.getByText('Schwarz')).toBeInTheDocument();
    expect(screen.queryByText(/Du ·|Gegner ·/)).not.toBeInTheDocument();
  });

  it('zeigt "Du bist am Zug", wenn die eigene Rolle am Zug ist', () => {
    // ARRANGE
    useGameState.mockReturnValue(state({ role: 'w' }));

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Du bist am Zug')).toBeInTheDocument();
  });

  it('hebt die Zeile des Gegners hervor und zeigt kein "Du bist am Zug", wenn der Gegner am Zug ist', () => {
    // ARRANGE
    useGameState.mockReturnValue(state({ role: 'w' }, { sideToMove: 'b' }));

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Gegner · Schwarz').closest('[data-testid="player-row"]')).toHaveAttribute('data-active', 'true');
    expect(screen.queryByText('Du bist am Zug')).not.toBeInTheDocument();
  });

  it('zeigt während eines laufenden Zuges die Wartemeldung statt der Zugzeile', () => {
    // ARRANGE
    useGameState.mockReturnValue(state({ role: 'w', pending: true }));

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Zug wird gespielt…')).toBeInTheDocument();
    expect(screen.queryByText(/am Zug$/)).not.toBeInTheDocument();
  });

  it('zeigt bei beendeter Partie weder Wartemeldung noch Zugzeile, aber das Ergebnis', () => {
    // ARRANGE
    useGameState.mockReturnValue(state({ role: 'w' }, { status: 'DRAW', endReason: 'STALEMATE' }));

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.queryByText(/am Zug$/)).not.toBeInTheDocument();
    expect(screen.queryByText('Zug wird gespielt…')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Remis (Patt)');
  });

  it('zeigt kein Brett, solange die Partie nicht geladen ist', () => {
    // ARRANGE
    useGameState.mockReturnValue(state({ game: null, loading: true }));

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Lade Brett…')).toBeInTheDocument();
    expect(screen.queryByTestId('board')).not.toBeInTheDocument();
    expect(document.querySelector('[data-turn-indicator]')).toBeNull();
  });

  it('zeigt einen Fehler als eigenen Absatz', () => {
    // ARRANGE
    useGameState.mockReturnValue(state({ role: 'w', error: new Error('Dieser Zug ist nicht legal.') }));

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Fehler: Dieser Zug ist nicht legal.')).toBeInTheDocument();
  });

  it('zeigt bei gelöschter Partie den Hinweis mit Link zur Startseite und ein gesperrtes Brett', () => {
    // ARRANGE
    useGameState.mockReturnValue(state({ role: 'w', deleted: true }));

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByRole('alert')).toHaveTextContent('Diese Partie wurde gelöscht.');
    expect(screen.getByRole('link', { name: 'Zur Startseite' })).toHaveAttribute('href', '/');
    expect(screen.getByTestId('board')).toHaveAttribute('data-disabled', 'true');
    expect(screen.queryByText(/am Zug$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Fehler:/)).not.toBeInTheDocument();
  });

  it('Schwarz sieht das Brett gedreht', () => {
    // ARRANGE
    useGameState.mockReturnValue(state({ role: 'b', inviteToken: null }));

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(firstSquare()).toBe('h1');
  });

  it('Zuschauer sieht Weiß unten und kann drehen', async () => {
    // ARRANGE
    useGameState.mockReturnValue(state());
    renderAt('/game/g-1');
    expect(firstSquare()).toBe('a8');

    // ACT & ASSERTIONS
    await userEvent.click(screen.getByRole('button', { name: 'Brett drehen' }));
    expect(firstSquare()).toBe('h1');
    await userEvent.click(screen.getByRole('button', { name: 'Brett drehen' }));
    expect(firstSquare()).toBe('a8');
  });

  it('beginnt beim Wechsel der Partie mit frischem Zustand', async () => {
    // ARRANGE
    useGameState.mockReturnValue(state());
    const router = createMemoryRouter([{ path: '/game/:gameId', element: <GamePage /> }], {
      initialEntries: ['/game/g-1'],
    });
    render(<RouterProvider router={router} />);
    await userEvent.click(screen.getByRole('button', { name: 'Brett drehen' }));
    expect(firstSquare()).toBe('h1');

    // ACT
    await act(() => router.navigate('/game/g-2'));

    // ASSERTIONS
    expect(firstSquare()).toBe('a8');
    expect(useGameState).toHaveBeenLastCalledWith('g-2', null);
  });

  it('Spieler sehen keinen Drehknopf', () => {
    // ARRANGE
    useGameState.mockReturnValue(state({ role: 'w' }));

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.queryByRole('button', { name: 'Brett drehen' })).not.toBeInTheDocument();
  });

  describe('data-turn-indicator', () => {
    it.each([
      ['du-bist-am-zug', 'w', 'w', false],
      ['gegner-ist-am-zug', 'w', 'b', false],
      ['zug-wird-gespielt', 'w', 'w', true],
      ['zuschauer', null, 'w', false],
    ] as const)('trägt den Wert %s', (erwartet, role, sideToMove, pending) => {
      // ARRANGE
      useGameState.mockReturnValue(state({ role, pending }, { sideToMove }));

      // ACT
      renderAt('/game/g-1');

      // ASSERTIONS
      expect(document.querySelector('[data-turn-indicator]')).toHaveAttribute('data-turn-indicator', erwartet);
    });

    it('fehlt nach dem Partieende', () => {
      // ARRANGE
      useGameState.mockReturnValue(state({ role: 'w' }, { status: 'BLACK_WON', endReason: 'CHECKMATE' }));

      // ACT
      renderAt('/game/g-1');

      // ASSERTIONS
      expect(document.querySelector('[data-turn-indicator]')).toBeNull();
    });
  });

  it('zeigt Kopier-Buttons nur dem Ersteller', () => {
    // ARRANGE
    useGameState.mockReturnValue(state({ role: 'w', inviteToken: 'invite-tok' }));

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByRole('button', { name: /Einladungslink kopieren/ })).toHaveAttribute(
      'data-link', expect.stringContaining('?invite=invite-tok'),
    );
    expect(screen.getByRole('button', { name: /Zuschauerlink kopieren/ })).toBeInTheDocument();
  });

  it('zeigt Gästen keine Kopier-Buttons', () => {
    // ARRANGE
    useGameState.mockReturnValue(state({ role: 'b', inviteToken: null }));

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.queryByRole('button', { name: /kopieren/ })).not.toBeInTheDocument();
  });

  it('zeigt das Ergebnis zweistufig: eigene Sicht und neutrale Zeile', () => {
    // ARRANGE
    useGameState.mockReturnValue(state({ role: 'w' }, { status: 'WHITE_WON', endReason: 'CHECKMATE' }));

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Du hast gewonnen')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Schachmatt — Weiß gewinnt');
  });

  describe('Schach und Ergebnis', () => {
    const KING_BOARD = Array.from({ length: 8 }, () => Array(8).fill(null));
    KING_BOARD[7][4] = 'wK';
    KING_BOARD[0][4] = 'bK';

    it('rahmt den König im Schach und zeigt die Marke in seiner Zeile', () => {
      // ARRANGE
      useGameState.mockReturnValue(state({ role: 'w' }, { board: KING_BOARD, sideToMove: 'w', checkState: 'CHECK_WHITE', moveCount: 3 }));

      // ACT
      renderAt('/game/g-1');

      // ASSERTIONS
      expect(document.querySelector('[data-square="e1"]')).toHaveAttribute('data-check', 'check');
      const badge = screen.getByText('Schach');
      expect(badge.closest('[data-testid="player-row"]')).toHaveTextContent('Du · Weiß');
    });

    it('markiert den mattgesetzten König als mate und zeigt keine Schach-Marke', () => {
      // ARRANGE
      useGameState.mockReturnValue(
        state({ role: 'w' }, { board: KING_BOARD, sideToMove: 'w', checkState: 'CHECK_WHITE', moveCount: 4, status: 'BLACK_WON', endReason: 'CHECKMATE' }),
      );

      // ACT
      renderAt('/game/g-1');

      // ASSERTIONS
      expect(document.querySelector('[data-square="e1"]')).toHaveAttribute('data-check', 'mate');
      expect(screen.queryByText('Schach')).not.toBeInTheDocument();
    });

    it('lässt den König wackeln, wenn das letzte Ereignis Schach ist', () => {
      // ARRANGE
      useGameState.mockReturnValue(
        state(
          { role: 'w', feedback: { event: 'check-received', seq: 1, attentionSeq: 1 } },
          { board: KING_BOARD, sideToMove: 'w', checkState: 'CHECK_WHITE', moveCount: 3 },
        ),
      );

      // ACT
      renderAt('/game/g-1');

      // ASSERTIONS
      expect(document.querySelector('[data-square="e1"] .motion-safe\\:animate-king-wiggle')).not.toBeNull();
    });

    it('rahmt den König der Seite aus checkState, nicht aus sideToMove', () => {
      // ARRANGE — bewusst widersprüchlich: nur checkState darf entscheiden
      useGameState.mockReturnValue(state({ role: 'w' }, { board: KING_BOARD, sideToMove: 'w', checkState: 'CHECK_BLACK', moveCount: 5 }));

      // ACT
      renderAt('/game/g-1');

      // ASSERTIONS
      expect(document.querySelector('[data-square="e8"]')).toHaveAttribute('data-check', 'check');
      expect(screen.getByText('Schach').closest('[data-testid="player-row"]')).toHaveTextContent('Gegner · Schwarz');
    });

    it('verkleinert das Brett bei beendeter Partie, damit das Ergebnis sichtbar bleibt', () => {
      // ARRANGE
      useGameState.mockReturnValue(state({ role: 'w' }));
      const { unmount } = renderAt('/game/g-1');
      const running = (document.querySelector('[data-board-column]') as HTMLElement).style.getPropertyValue('--board-size');
      unmount();
      useGameState.mockReturnValue(state({ role: 'w' }, { status: 'WHITE_WON', endReason: 'CHECKMATE' }));

      // ACT
      renderAt('/game/g-1');

      // ASSERTIONS
      const ended = (document.querySelector('[data-board-column]') as HTMLElement).style.getPropertyValue('--board-size');
      expect(running).toContain('11rem');
      expect(ended).toContain('17rem');
    });

    it('zeigt das Ergebnis in der Brett-Spalte, nicht in der Seitenleiste', () => {
      // ARRANGE
      useGameState.mockReturnValue(state({ role: 'w' }, { status: 'WHITE_WON', endReason: 'CHECKMATE' }));

      // ACT
      renderAt('/game/g-1');

      // ASSERTIONS
      const result = screen.getByRole('status');
      expect(result.closest('aside')).toBeNull();
      expect(result.closest('[data-board-column]')).not.toBeNull();
    });

    it('bietet den Stumm-Schalter an', () => {
      // ARRANGE
      useGameState.mockReturnValue(state({ role: 'w' }));

      // ACT
      renderAt('/game/g-1');

      // ASSERTIONS
      expect(screen.getByRole('button', { name: /Ton (aus|ein)schalten/ })).toBeInTheDocument();
    });
  });
});

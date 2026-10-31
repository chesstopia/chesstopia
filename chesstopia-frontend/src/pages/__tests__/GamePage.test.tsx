import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';

const { useGameState } = vi.hoisted(() => ({ useGameState: vi.fn() }));
vi.mock('@/hooks/useGameState', () => ({ useGameState }));

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

import { GamePage } from '../GamePage';

const BOARD = Array.from({ length: 8 }, () => Array(8).fill(null));

const BASE = {
  board: BOARD, sideToMove: 'w', status: 'ONGOING', endReason: null, error: null,
  loading: false, pending: false, role: null, entry: undefined, deleted: false,
  moves: [], lastMove: null, playMove: vi.fn(),
};

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

  it('zeigt neutrale Seitennamen ohne Du/Gegner, wenn keine Rolle aufgelöst ist', () => {
    // ARRANGE
    useGameState.mockReturnValue({
      board: BOARD, sideToMove: 'w', status: 'ONGOING', endReason: null,
      error: null, loading: false, pending: false, role: null, entry: undefined,
      playMove: vi.fn(), moves: [], lastMove: null,
    });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Weiß')).toBeInTheDocument();
    expect(screen.getByText('Schwarz')).toBeInTheDocument();
    expect(screen.queryByText(/Du ·|Gegner ·/)).not.toBeInTheDocument();
  });

  it('zeigt "Du bist am Zug", wenn die eigene Rolle am Zug ist', () => {
    // ARRANGE
    useGameState.mockReturnValue({
      board: BOARD, sideToMove: 'w', status: 'ONGOING', endReason: null,
      error: null, loading: false, pending: false, role: 'w', entry: undefined,
      playMove: vi.fn(), moves: [], lastMove: null,
    });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Du bist am Zug')).toBeInTheDocument();
  });

  it('hebt die Zeile des Gegners hervor und zeigt kein "Du bist am Zug", wenn der Gegner am Zug ist', () => {
    // ARRANGE
    useGameState.mockReturnValue({
      board: BOARD, sideToMove: 'b', status: 'ONGOING', endReason: null,
      error: null, loading: false, pending: false, role: 'w', entry: undefined,
      playMove: vi.fn(), moves: [], lastMove: null,
    });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Gegner · Schwarz').closest('[data-testid="player-row"]')).toHaveAttribute('data-active', 'true');
    expect(screen.queryByText('Du bist am Zug')).not.toBeInTheDocument();
  });

  it('zeigt während eines laufenden Zuges die Wartemeldung statt der Zugzeile', () => {
    // ARRANGE
    useGameState.mockReturnValue({
      board: BOARD, sideToMove: 'w', status: 'ONGOING', endReason: null,
      error: null, loading: false, pending: true, role: 'w', entry: undefined,
      playMove: vi.fn(), moves: [], lastMove: null,
    });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Zug wird gespielt…')).toBeInTheDocument();
    expect(screen.queryByText(/am Zug$/)).not.toBeInTheDocument();
  });

  it('zeigt bei beendeter Partie weder Wartemeldung noch Zugzeile, aber das Ergebnis', () => {
    // ARRANGE
    useGameState.mockReturnValue({
      board: BOARD, sideToMove: 'w', status: 'DRAW', endReason: 'STALEMATE',
      error: null, loading: false, pending: false, role: 'w', entry: undefined,
      playMove: vi.fn(), moves: [], lastMove: null,
    });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.queryByText(/am Zug$/)).not.toBeInTheDocument();
    expect(screen.queryByText('Zug wird gespielt…')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Remis (Patt)');
  });

  it('zeigt einen Fehler als eigenen Absatz', () => {
    // ARRANGE
    useGameState.mockReturnValue({
      board: BOARD, sideToMove: 'w', status: 'ONGOING', endReason: null,
      error: new Error('Dieser Zug ist nicht legal.'), loading: false, pending: false, role: 'w',
      entry: undefined, playMove: vi.fn(), moves: [], lastMove: null,
    });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Fehler: Dieser Zug ist nicht legal.')).toBeInTheDocument();
  });

  it('zeigt bei gelöschter Partie den Hinweis mit Link zur Startseite und ein gesperrtes Brett', () => {
    // ARRANGE
    useGameState.mockReturnValue({
      board: BOARD, sideToMove: 'w', status: 'ONGOING', endReason: null,
      error: null, loading: false, pending: false, role: 'w', entry: undefined,
      deleted: true, playMove: vi.fn(), moves: [], lastMove: null,
    });

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
    useGameState.mockReturnValue({
      ...BASE, role: 'b', entry: { gameId: 'g-1', role: 'INVITED', inviteToken: 'invite-tok' },
    });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(firstSquare()).toBe('h1');
  });

  it('Zuschauer sieht Weiß unten und kann drehen', async () => {
    // ARRANGE
    useGameState.mockReturnValue({ ...BASE });
    renderAt('/game/g-1');
    expect(firstSquare()).toBe('a8');

    // ACT & ASSERTIONS
    await userEvent.click(screen.getByRole('button', { name: 'Brett drehen' }));
    expect(firstSquare()).toBe('h1');
    await userEvent.click(screen.getByRole('button', { name: 'Brett drehen' }));
    expect(firstSquare()).toBe('a8');
  });

  it('Spieler sehen keinen Drehknopf', () => {
    // ARRANGE
    useGameState.mockReturnValue({ ...BASE, role: 'w' });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.queryByRole('button', { name: 'Brett drehen' })).not.toBeInTheDocument();
  });

  describe('data-turn-indicator', () => {
    it.each([
      ['du-bist-am-zug', { role: 'w', sideToMove: 'w' }],
      ['gegner-ist-am-zug', { role: 'w', sideToMove: 'b' }],
      ['zug-wird-gespielt', { role: 'w', sideToMove: 'w', pending: true }],
      ['zuschauer', { role: null, sideToMove: 'w' }],
    ])('trägt den Wert %s', (erwartet, state) => {
      // ARRANGE
      useGameState.mockReturnValue({ ...BASE, ...state });

      // ACT
      renderAt('/game/g-1');

      // ASSERTIONS
      expect(document.querySelector('[data-turn-indicator]')).toHaveAttribute('data-turn-indicator', erwartet);
    });

    it('fehlt nach dem Partieende', () => {
      // ARRANGE
      useGameState.mockReturnValue({ ...BASE, role: 'w', status: 'BLACK_WON', endReason: 'CHECKMATE' });

      // ACT
      renderAt('/game/g-1');

      // ASSERTIONS
      expect(document.querySelector('[data-turn-indicator]')).toBeNull();
    });
  });

  it('zeigt Kopier-Buttons nur dem Ersteller', () => {
    // ARRANGE
    useGameState.mockReturnValue({
      ...BASE, role: 'w', entry: { gameId: 'g-1', role: 'OWNER', ownerToken: 'o', inviteToken: 'invite-tok' },
    });

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
    useGameState.mockReturnValue({
      ...BASE, role: 'b', entry: { gameId: 'g-1', role: 'INVITED', inviteToken: 'invite-tok' },
    });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.queryByRole('button', { name: /kopieren/ })).not.toBeInTheDocument();
  });

  it('zeigt das Ergebnis zweistufig: eigene Sicht und neutrale Zeile', () => {
    // ARRANGE
    useGameState.mockReturnValue({ ...BASE, role: 'w', status: 'WHITE_WON', endReason: 'CHECKMATE' });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Du hast gewonnen')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Schachmatt — Weiß gewinnt');
  });
});

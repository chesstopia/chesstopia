import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

const { useGameState } = vi.hoisted(() => ({ useGameState: vi.fn() }));
vi.mock('@/hooks/useGameState', () => ({ useGameState }));

import { GamePage } from '../GamePage';

const BOARD = Array.from({ length: 8 }, () => Array(8).fill(null));

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
  it('zeigt "Zuschauer", wenn keine Rolle aufgelöst ist', () => {
    // ARRANGE
    useGameState.mockReturnValue({
      board: BOARD, sideToMove: 'w', status: 'ONGOING', endReason: null,
      error: null, loading: false, pending: false, role: null, entry: undefined,
      playMove: vi.fn(),
    });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Zuschauer')).toBeInTheDocument();
  });

  it('zeigt "Du bist am Zug", wenn die eigene Rolle am Zug ist', () => {
    // ARRANGE
    useGameState.mockReturnValue({
      board: BOARD, sideToMove: 'w', status: 'ONGOING', endReason: null,
      error: null, loading: false, pending: false, role: 'w', entry: undefined,
      playMove: vi.fn(),
    });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Du bist am Zug')).toBeInTheDocument();
  });

  it('zeigt "Gegner ist am Zug", wenn die eigene Rolle nicht am Zug ist', () => {
    // ARRANGE
    useGameState.mockReturnValue({
      board: BOARD, sideToMove: 'b', status: 'ONGOING', endReason: null,
      error: null, loading: false, pending: false, role: 'w', entry: undefined,
      playMove: vi.fn(),
    });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText('Gegner ist am Zug')).toBeInTheDocument();
  });

  it('zeigt Einladungs- und Zuschauer-Link nur dem Ersteller', () => {
    // ARRANGE
    useGameState.mockReturnValue({
      board: BOARD, sideToMove: 'w', status: 'ONGOING', endReason: null,
      error: null, loading: false, pending: false, role: 'w',
      entry: { gameId: 'g-1', role: 'OWNER', ownerToken: 'owner-tok', inviteToken: 'invite-tok' },
      playMove: vi.fn(),
    });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.getByText(/invite=invite-tok/)).toBeInTheDocument();
  });

  it('zeigt keinen Einladungslink für Gäste', () => {
    // ARRANGE
    useGameState.mockReturnValue({
      board: BOARD, sideToMove: 'w', status: 'ONGOING', endReason: null,
      error: null, loading: false, pending: false, role: 'b',
      entry: { gameId: 'g-1', role: 'INVITED', inviteToken: 'invite-tok' },
      playMove: vi.fn(),
    });

    // ACT
    renderAt('/game/g-1');

    // ASSERTIONS
    expect(screen.queryByText(/invite=/)).not.toBeInTheDocument();
  });
});

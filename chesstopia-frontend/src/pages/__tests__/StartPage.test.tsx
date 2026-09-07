import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

const { createGame, getGame } = vi.hoisted(() => ({ createGame: vi.fn(), getGame: vi.fn() }));
vi.mock('@chesstopia/openapi-client', () => ({
  Configuration: class {},
  GameApi: class {
    createGame = createGame;
    getGame = getGame;
  },
}));

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigate };
});

import { StartPage } from '../StartPage';
import { addOwnedGame } from '@/lib/gameStorage';

describe('StartPage', () => {
  beforeEach(() => {
    localStorage.clear();
    createGame.mockReset();
    getGame.mockReset();
    navigate.mockReset();
  });

  it('legt beim Klick eine Partie an, merkt sich die Tokens und navigiert', async () => {
    // ARRANGE
    createGame.mockResolvedValue({
      data: { id: 'g-neu', ownerToken: 'owner-x', inviteToken: 'invite-x', status: 'ONGOING', moveCount: 0 },
    });
    render(<StartPage />, { wrapper: MemoryRouter });

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Neue Partie starten' }));

    // ASSERTIONS
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/game/g-neu'));
    const stored = JSON.parse(localStorage.getItem('chesstopia.games') ?? '[]');
    expect(stored).toEqual([{ gameId: 'g-neu', role: 'OWNER', ownerToken: 'owner-x', inviteToken: 'invite-x' }]);
  });

  it('zeigt eine Zeile pro eigener Partie mit ihrem Status', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'o1', 'i1');
    getGame.mockResolvedValue({ data: { id: 'g-1', status: 'WHITE_WON', endReason: 'CHECKMATE', moveCount: 5 } });

    // ACT
    render(<StartPage />, { wrapper: MemoryRouter });

    // ASSERTIONS
    expect(await screen.findByText(/Weiß hat gewonnen/)).toBeInTheDocument();
  });

  it('markiert eine nicht mehr erreichbare Partie statt die ganze Liste abzubrechen', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'o1', 'i1');
    addOwnedGame('g-2', 'o2', 'i2');
    getGame.mockImplementation((id: string) =>
      id === 'g-1'
        ? Promise.reject(new Error('404'))
        : Promise.resolve({ data: { id: 'g-2', status: 'ONGOING', endReason: null, moveCount: 0 } }),
    );

    // ACT
    render(<StartPage />, { wrapper: MemoryRouter });

    // ASSERTIONS
    expect(await screen.findByText(/nicht verfügbar/)).toBeInTheDocument();
    expect(await screen.findByText(/Läuft/)).toBeInTheDocument();
  });
});

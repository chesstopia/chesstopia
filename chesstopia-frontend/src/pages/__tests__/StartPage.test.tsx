import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

const { createGame, getGame, deleteGame } = vi.hoisted(() => ({
  createGame: vi.fn(),
  getGame: vi.fn(),
  deleteGame: vi.fn(),
}));
vi.mock('@chesstopia/openapi-client', () => ({
  Configuration: class {},
  GameApi: class {
    createGame = createGame;
    getGame = getGame;
    deleteGame = deleteGame;
  },
}));

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigate };
});

import { StartPage } from '../StartPage';
import { addOwnedGame, myGames } from '@/lib/gameStorage';

describe('StartPage', () => {
  beforeEach(() => {
    localStorage.clear();
    createGame.mockReset();
    getGame.mockReset();
    deleteGame.mockReset();
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

  it('zeigt einen Fehler, wenn das Anlegen der Partie fehlschlägt', async () => {
    // ARRANGE
    createGame.mockRejectedValue(new Error('Netzwerkfehler'));
    render(<StartPage />, { wrapper: MemoryRouter });

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Neue Partie starten' }));

    // ASSERTIONS
    expect(await screen.findByText(/Fehler: Netzwerkfehler/)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
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

  describe('Löschen', () => {
    const ongoing = { data: { id: 'g-1', status: 'ONGOING', endReason: null, moveCount: 0 } };

    async function openDialog() {
      const item = (await screen.findByText(/Läuft/)).closest('li') as HTMLElement;
      await userEvent.click(within(item).getByRole('button', { name: 'Löschen' }));
      return item;
    }

    it('Abbrechen im Dialog löscht nichts', async () => {
      // ARRANGE
      addOwnedGame('g-1', 'owner-1', 'i1');
      getGame.mockResolvedValue(ongoing);
      render(<StartPage />, { wrapper: MemoryRouter });
      await openDialog();

      // ACT
      await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));

      // ASSERTIONS
      expect(deleteGame).not.toHaveBeenCalled();
      expect(screen.getByText(/Läuft/)).toBeInTheDocument();
      expect(myGames()).toHaveLength(1);
    });

    it('Bestätigen löscht mit dem Ersteller-Token, entfernt Zeile und Eintrag', async () => {
      // ARRANGE
      addOwnedGame('g-1', 'owner-1', 'i1');
      getGame.mockResolvedValue(ongoing);
      deleteGame.mockResolvedValue({});
      render(<StartPage />, { wrapper: MemoryRouter });
      await openDialog();

      // ACT
      await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Löschen' }));

      // ASSERTIONS
      await waitFor(() => expect(screen.queryByText(/Läuft/)).not.toBeInTheDocument());
      expect(deleteGame).toHaveBeenCalledWith('g-1', 'owner-1');
      expect(myGames()).toHaveLength(0);
    });

    it('404 beim Löschen gilt als gelöscht, auch bei nicht verfügbarer Partie', async () => {
      // ARRANGE
      addOwnedGame('g-1', 'owner-1', 'i1');
      getGame.mockRejectedValue({ response: { status: 404 } });
      deleteGame.mockRejectedValue({ response: { status: 404 } });
      render(<StartPage />, { wrapper: MemoryRouter });
      const item = (await screen.findByText(/nicht verfügbar/)).closest('li') as HTMLElement;
      await userEvent.click(within(item).getByRole('button', { name: 'Löschen' }));

      // ACT
      await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Löschen' }));

      // ASSERTIONS
      await waitFor(() => expect(screen.queryByText(/nicht verfügbar/)).not.toBeInTheDocument());
      expect(screen.queryByText(/Fehler:/)).not.toBeInTheDocument();
      expect(myGames()).toHaveLength(0);
    });

    it('ein anderer Fehler lässt Zeile und Eintrag stehen und zeigt die Meldung in der Zeile', async () => {
      // ARRANGE
      addOwnedGame('g-1', 'owner-1', 'i1');
      getGame.mockResolvedValue(ongoing);
      deleteGame.mockRejectedValue(new Error('Netzwerkfehler'));
      render(<StartPage />, { wrapper: MemoryRouter });
      await openDialog();

      // ACT
      await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Löschen' }));

      // ASSERTIONS
      const message = await screen.findByText(/^Fehler:/);
      expect(message.closest('li')).toHaveTextContent(/Läuft/);
      expect(myGames()).toHaveLength(1);
    });

    it('der Bestätigen-Knopf löst während des Löschens keinen zweiten Aufruf aus', async () => {
      // ARRANGE
      addOwnedGame('g-1', 'owner-1', 'i1');
      getGame.mockResolvedValue(ongoing);
      deleteGame.mockReturnValue(new Promise(() => {}));
      render(<StartPage />, { wrapper: MemoryRouter });
      await openDialog();
      const confirm = within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Löschen' });

      // ACT
      await userEvent.click(confirm);
      await userEvent.click(confirm);

      // ASSERTIONS
      expect(deleteGame).toHaveBeenCalledTimes(1);
    });

    it('die Löschknöpfe der Zeilen sind gesperrt, solange ein Löschen läuft', async () => {
      // ARRANGE
      addOwnedGame('g-1', 'owner-1', 'i1');
      addOwnedGame('g-2', 'owner-2', 'i2');
      getGame.mockResolvedValue(ongoing);
      deleteGame.mockReturnValue(new Promise(() => {}));
      render(<StartPage />, { wrapper: MemoryRouter });
      await waitFor(() => expect(screen.getAllByRole('button', { name: 'Löschen' })).toHaveLength(2));
      await userEvent.click(screen.getAllByRole('button', { name: 'Löschen' })[0]);

      // ACT
      await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Löschen' }));

      // ASSERTIONS
      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
      const rowButtons = screen.getAllByRole('button', { name: 'Löschen' });
      expect(rowButtons).toHaveLength(2);
      expect(rowButtons[1]).toBeDisabled();
    });
  });
});

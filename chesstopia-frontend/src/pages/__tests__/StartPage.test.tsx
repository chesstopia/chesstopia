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
import { TooltipProvider } from '@/components/ui/tooltip';
import { addInvitedGame, addOwnedGame, allGames, myGames } from '@/lib/gameStorage';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <TooltipProvider>{children}</TooltipProvider>
    </MemoryRouter>
  );
}

function game(id: string, overrides: Record<string, unknown> = {}) {
  return {
    data: {
      id,
      position: { sideToMove: 'WHITE', board: [] },
      status: 'ONGOING',
      endReason: null,
      moveCount: 0,
      lastActivityAt: '2026-10-29T10:00:00Z',
      ...overrides,
    },
  };
}

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
    render(<StartPage />, { wrapper: Wrapper });

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Neue Partie' }));

    // ASSERTIONS
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/game/g-neu'));
    const stored = JSON.parse(localStorage.getItem('chesstopia.games') ?? '[]');
    expect(stored).toEqual([{ gameId: 'g-neu', role: 'OWNER', ownerToken: 'owner-x', inviteToken: 'invite-x' }]);
  });

  it('zeigt einen Fehler, wenn das Anlegen der Partie fehlschlägt', async () => {
    // ARRANGE
    createGame.mockRejectedValue(new Error('Netzwerkfehler'));
    render(<StartPage />, { wrapper: Wrapper });

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Neue Partie' }));

    // ASSERTIONS
    expect(await screen.findByText(/Fehler: Netzwerkfehler/)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('leerer Zustand zeigt „Neue Partie“', () => {
    // ACT
    render(<StartPage />, { wrapper: Wrapper });

    // ASSERTIONS
    expect(screen.getByText(/Noch keine Partien/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Neue Partie' })).toHaveLength(1);
  });

  it('teilt in Laufend und Beendet, jeweils neueste zuerst', async () => {
    // ARRANGE
    ['g-alt', 'g-neu', 'g-fertig-alt', 'g-fertig-neu'].forEach((id) => addOwnedGame(id, `o-${id}`, `i-${id}`));
    getGame.mockImplementation((id: string) =>
      Promise.resolve(
        {
          'g-alt': game(id, { lastActivityAt: '2026-10-20T10:00:00Z' }),
          'g-neu': game(id, { lastActivityAt: '2026-10-28T10:00:00Z' }),
          'g-fertig-alt': game(id, { status: 'WHITE_WON', endReason: 'CHECKMATE', lastActivityAt: '2026-10-01T10:00:00Z' }),
          'g-fertig-neu': game(id, { status: 'DRAW', endReason: 'STALEMATE', lastActivityAt: '2026-10-10T10:00:00Z' }),
        }[id],
      ),
    );

    // ACT
    render(<StartPage />, { wrapper: Wrapper });

    // ASSERTIONS
    await screen.findByText('Remis · Patt');
    const order = (section: string) =>
      Array.from(document.querySelectorAll(`[data-section="${section}"]`)).map((el) => el.getAttribute('data-game-id'));
    expect(order('laufend')).toEqual(['g-neu', 'g-alt']);
    expect(order('beendet')).toEqual(['g-fertig-neu', 'g-fertig-alt']);
    expect(screen.getByRole('heading', { name: 'Laufend' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Beendet' })).toBeInTheDocument();
  });

  it('lässt eine leere Abschnittsüberschrift weg', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'o1', 'i1');
    getGame.mockResolvedValue(game('g-1'));

    // ACT
    render(<StartPage />, { wrapper: Wrapper });

    // ASSERTIONS
    await screen.findByText('Du bist am Zug');
    expect(screen.queryByRole('heading', { name: 'Beendet' })).not.toBeInTheDocument();
  });

  it('zeigt eingeladene Partien', async () => {
    // ARRANGE
    addInvitedGame('g-2', 'inv-2');
    getGame.mockResolvedValue(game('g-2', { position: { sideToMove: 'BLACK', board: [] } }));

    // ACT
    render(<StartPage />, { wrapper: Wrapper });

    // ASSERTIONS
    expect(await screen.findByText('Du spielst Schwarz · eingeladen')).toBeInTheDocument();
    expect(screen.getByText('Du bist am Zug')).toBeInTheDocument();
    expect(getGame).toHaveBeenCalledWith('g-2');
  });

  it('markiert eine nicht mehr erreichbare Partie statt die ganze Liste abzubrechen', async () => {
    // ARRANGE
    addOwnedGame('g-1', 'o1', 'i1');
    addOwnedGame('g-2', 'o2', 'i2');
    getGame.mockImplementation((id: string) => (id === 'g-1' ? Promise.reject(new Error('404')) : Promise.resolve(game('g-2'))));

    // ACT
    render(<StartPage />, { wrapper: Wrapper });

    // ASSERTIONS
    expect(await screen.findByText('Partie nicht mehr verfügbar')).toBeInTheDocument();
    expect(await screen.findByText('Du bist am Zug')).toBeInTheDocument();
  });

  describe('Entfernen', () => {
    async function openRemoveDialog() {
      await userEvent.click(await screen.findByRole('button', { name: 'Aus Liste entfernen' }));
    }

    it('fragt nach und ruft kein API; Abbrechen lässt die Zeile stehen', async () => {
      // ARRANGE
      addInvitedGame('g-2', 'inv-2');
      getGame.mockResolvedValue(game('g-2'));
      render(<StartPage />, { wrapper: Wrapper });
      await openRemoveDialog();
      const dialog = screen.getByRole('alertdialog');
      expect(within(dialog).getByText('Partie aus Liste entfernen?')).toBeInTheDocument();
      expect(within(dialog).getByText(/über den Einladungslink wieder erreichbar/)).toBeInTheDocument();

      // ACT
      await userEvent.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));

      // ASSERTIONS
      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
      expect(document.querySelector('[data-game-id="g-2"]')).not.toBeNull();
      expect(allGames()).toHaveLength(1);
    });

    it('Bestätigen entfernt Zeile und Eintrag, ohne deleteGame aufzurufen', async () => {
      // ARRANGE
      addInvitedGame('g-2', 'inv-2');
      getGame.mockResolvedValue(game('g-2'));
      render(<StartPage />, { wrapper: Wrapper });
      await openRemoveDialog();

      // ACT
      await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Entfernen' }));

      // ASSERTIONS
      await waitFor(() => expect(document.querySelector('[data-game-id="g-2"]')).toBeNull());
      expect(deleteGame).not.toHaveBeenCalled();
      expect(allGames()).toHaveLength(0);
    });

    it('eine nicht mehr verfügbare eingeladene Partie lässt sich entfernen', async () => {
      // ARRANGE
      addInvitedGame('g-2', 'inv-2');
      getGame.mockRejectedValue({ response: { status: 404 } });
      render(<StartPage />, { wrapper: Wrapper });
      expect(await screen.findByText('Partie nicht mehr verfügbar')).toBeInTheDocument();
      await openRemoveDialog();
      const dialog = screen.getByRole('alertdialog');
      expect(within(dialog).getByText('Die Partie ist nicht mehr abrufbar.')).toBeInTheDocument();
      expect(within(dialog).queryByText(/Einladungslink/)).toBeNull();

      // ACT
      await userEvent.click(within(dialog).getByRole('button', { name: 'Entfernen' }));

      // ASSERTIONS
      await waitFor(() => expect(screen.queryByText('Partie nicht mehr verfügbar')).not.toBeInTheDocument());
      expect(allGames()).toHaveLength(0);
    });
  });

  describe('Löschen', () => {
    const ongoing = game('g-1');

    async function openDialog() {
      const item = (await screen.findByText('Du bist am Zug')).closest('li') as HTMLElement;
      await userEvent.click(within(item).getByRole('button', { name: 'Partie löschen' }));
      return item;
    }

    it('Abbrechen im Dialog löscht nichts', async () => {
      // ARRANGE
      addOwnedGame('g-1', 'owner-1', 'i1');
      getGame.mockResolvedValue(ongoing);
      render(<StartPage />, { wrapper: Wrapper });
      await openDialog();

      // ACT
      await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));

      // ASSERTIONS
      expect(deleteGame).not.toHaveBeenCalled();
      expect(screen.getByText('Du bist am Zug')).toBeInTheDocument();
      expect(myGames()).toHaveLength(1);
    });

    it('Bestätigen löscht mit dem Ersteller-Token, entfernt Zeile und Eintrag', async () => {
      // ARRANGE
      addOwnedGame('g-1', 'owner-1', 'i1');
      getGame.mockResolvedValue(ongoing);
      deleteGame.mockResolvedValue({});
      render(<StartPage />, { wrapper: Wrapper });
      await openDialog();

      // ACT
      await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Löschen' }));

      // ASSERTIONS
      await waitFor(() => expect(screen.queryByText('Du bist am Zug')).not.toBeInTheDocument());
      expect(deleteGame).toHaveBeenCalledWith('g-1', 'owner-1');
      expect(myGames()).toHaveLength(0);
    });

    it('404 beim Löschen gilt als gelöscht, auch bei nicht verfügbarer Partie', async () => {
      // ARRANGE
      addOwnedGame('g-1', 'owner-1', 'i1');
      getGame.mockRejectedValue({ response: { status: 404 } });
      deleteGame.mockRejectedValue({ response: { status: 404 } });
      render(<StartPage />, { wrapper: Wrapper });
      const item = (await screen.findByText('Partie nicht mehr verfügbar')).closest('li') as HTMLElement;
      await userEvent.click(within(item).getByRole('button', { name: 'Partie löschen' }));

      // ACT
      await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Löschen' }));

      // ASSERTIONS
      await waitFor(() => expect(screen.queryByText('Partie nicht mehr verfügbar')).not.toBeInTheDocument());
      expect(screen.queryByText(/Fehler:/)).not.toBeInTheDocument();
      expect(myGames()).toHaveLength(0);
    });

    it('ein anderer Fehler lässt Zeile und Eintrag stehen und zeigt die Meldung in der Zeile', async () => {
      // ARRANGE
      addOwnedGame('g-1', 'owner-1', 'i1');
      getGame.mockResolvedValue(ongoing);
      deleteGame.mockRejectedValue(new Error('Netzwerkfehler'));
      render(<StartPage />, { wrapper: Wrapper });
      await openDialog();

      // ACT
      await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Löschen' }));

      // ASSERTIONS
      const message = await screen.findByText(/^Fehler:/);
      expect(message.closest('li')).toHaveTextContent('Du bist am Zug');
      expect(myGames()).toHaveLength(1);
    });

    it('der Bestätigen-Knopf löst während des Löschens keinen zweiten Aufruf aus', async () => {
      // ARRANGE
      addOwnedGame('g-1', 'owner-1', 'i1');
      getGame.mockResolvedValue(ongoing);
      deleteGame.mockReturnValue(new Promise(() => {}));
      render(<StartPage />, { wrapper: Wrapper });
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
      render(<StartPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getAllByRole('button', { name: 'Partie löschen' })).toHaveLength(2));
      await userEvent.click(screen.getAllByRole('button', { name: 'Partie löschen' })[0]);

      // ACT
      await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Löschen' }));

      // ASSERTIONS
      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
      const rowButtons = screen.getAllByRole('button', { name: 'Partie löschen' });
      expect(rowButtons).toHaveLength(2);
      expect(rowButtons[1]).toBeDisabled();
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { GameResponse } from '@chesstopia/openapi-client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GameRow } from '../GameRow';

const NOW = new Date(2026, 9, 29, 15, 0, 0);

function response(overrides: Partial<GameResponse> = {}): GameResponse {
  return {
    id: 'g-1',
    position: { sideToMove: 'WHITE', board: [] } as unknown as GameResponse['position'],
    status: 'ONGOING',
    endReason: null,
    moveCount: 4,
    lastActivityAt: new Date(2026, 9, 29, 14, 55, 0).toISOString(),
    ...overrides,
  } as GameResponse;
}

function renderRow(props: Partial<React.ComponentProps<typeof GameRow>> = {}) {
  const onDelete = vi.fn();
  const onRemove = vi.fn();
  render(
    <GameRow
      gameId="g-1"
      role="OWNER"
      game={response()}
      now={NOW}
      onDelete={onDelete}
      onRemove={onRemove}
      {...props}
    />,
    { wrapper: ({ children }) => <MemoryRouter><TooltipProvider>{children}</TooltipProvider></MemoryRouter> },
  );
  return { onDelete, onRemove };
}

describe('GameRow', () => {
  it('laufend und am Zug: Badge „Du bist am Zug“, Knopf „Fortsetzen“, „zuletzt gespielt“', () => {
    // ACT
    renderRow();

    // ASSERTIONS
    const row = document.querySelector('[data-game-id="g-1"]') as HTMLElement;
    expect(row).toHaveAttribute('data-section', 'laufend');
    expect(row).toHaveAttribute('data-color', 'w');
    expect(row).toHaveAttribute('data-invited', 'false');
    expect(screen.getByText('Du spielst Weiß')).toBeInTheDocument();
    expect(row.querySelector('[data-status-badge]')).toHaveTextContent('Du bist am Zug');
    expect(row.querySelector('[data-last-played]')).toHaveTextContent('zuletzt gespielt vor 5 Min.');
    expect(screen.getByRole('link', { name: 'Fortsetzen' })).toHaveAttribute('href', '/game/g-1');
  });

  it('laufend, Gegner am Zug: Badge „Gegner am Zug“, Knopf „Öffnen“', () => {
    // ACT
    renderRow({ game: response({ position: { sideToMove: 'BLACK', board: [] } as unknown as GameResponse['position'] }) });

    // ASSERTIONS
    expect(screen.getByText('Gegner am Zug')).toHaveAttribute('data-status-badge');
    expect(screen.getByRole('link', { name: 'Öffnen' })).toBeInTheDocument();
  });

  it('beendet: Ausgang aus eigener Sicht, Knopf „Ansehen“, Zeitangabe „beendet vor …“', () => {
    // ACT
    renderRow({ game: response({ status: 'WHITE_WON', endReason: 'CHECKMATE' }) });

    // ASSERTIONS
    const row = document.querySelector('[data-game-id="g-1"]') as HTMLElement;
    expect(row).toHaveAttribute('data-section', 'beendet');
    expect(row.querySelector('[data-status-badge]')).toHaveTextContent('Gewonnen · Schachmatt');
    expect(row.querySelector('[data-last-played]')).toHaveTextContent('beendet vor 5 Min.');
    expect(screen.getByRole('link', { name: 'Ansehen' })).toBeInTheDocument();
  });

  it('beendet vor Tagen: „beendet am 24.10.“', () => {
    // ACT
    renderRow({ game: response({ status: 'WHITE_WON', endReason: 'CHECKMATE', lastActivityAt: new Date(2026, 9, 24, 10, 0, 0).toISOString() }) });

    // ASSERTIONS
    expect(document.querySelector('[data-last-played]')).toHaveTextContent('beendet am 24.10.');
  });

  it.each([
    ['WHITE_WON', 'OWNER', 'won', 'bg-green-100'],
    ['BLACK_WON', 'OWNER', 'lost', 'bg-red-100'],
    ['DRAW', 'OWNER', 'draw', null],
    ['BLACK_WON', 'INVITED', 'won', 'bg-green-100'],
  ] as const)('beendet %s als %s: Ausgang %s am Badge', (status, role, kind, colorClass) => {
    // ACT
    renderRow({ role, game: response({ status, endReason: status === 'DRAW' ? 'STALEMATE' : 'CHECKMATE' }) });

    // ASSERTIONS
    const badge = document.querySelector('[data-status-badge]') as HTMLElement;
    expect(badge).toHaveAttribute('data-outcome', kind);
    if (colorClass) expect(badge.className).toContain(colorClass);
    else expect(badge.className).not.toMatch(/bg-(green|red)-100/);
  });

  it('laufend: kein data-outcome am Badge', () => {
    // ACT
    renderRow();

    // ASSERTIONS
    expect(document.querySelector('[data-status-badge]')).not.toHaveAttribute('data-outcome');
  });

  it('eingeladen: Schwarz, Zusatz „eingeladen“, Entfernen statt Löschen', async () => {
    // ARRANGE
    const { onDelete, onRemove } = renderRow({ role: 'INVITED' });

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Aus Liste entfernen' }));

    // ASSERTIONS
    const row = document.querySelector('[data-game-id="g-1"]') as HTMLElement;
    expect(row).toHaveAttribute('data-color', 'b');
    expect(row).toHaveAttribute('data-invited', 'true');
    expect(screen.getByText('Du spielst Schwarz · eingeladen')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Partie löschen' })).not.toBeInTheDocument();
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('eigen: Knopf „Partie löschen“ ruft onDelete', async () => {
    // ARRANGE
    const { onDelete, onRemove } = renderRow();

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Partie löschen' }));

    // ASSERTIONS
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('nicht verfügbar: gedämpft, kein Öffnen, Löschen bleibt möglich', () => {
    // ACT
    renderRow({ game: null });

    // ASSERTIONS
    expect(screen.getByText('Partie nicht mehr verfügbar')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Partie löschen' })).toBeInTheDocument();
  });

  it('gesperrt: Lösch-Knopf ist disabled; Fehlermeldung wird in der Zeile gezeigt', () => {
    // ACT
    renderRow({ disabled: true, error: 'Netzwerkfehler' });

    // ASSERTIONS
    expect(screen.getByRole('button', { name: 'Partie löschen' })).toBeDisabled();
    expect(screen.getByText('Fehler: Netzwerkfehler')).toBeInTheDocument();
  });
});

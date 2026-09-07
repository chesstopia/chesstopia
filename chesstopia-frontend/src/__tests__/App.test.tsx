import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';

const zustand = vi.hoisted(() => ({ wert: {} as Record<string, unknown> }));

vi.mock('@/hooks/useBoardState', () => ({
  useBoardState: () => zustand.wert,
}));

const GRUNDSTELLUNG = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));

function mitZustand(overrides: Record<string, unknown>) {
  zustand.wert = {
    board: GRUNDSTELLUNG,
    position: {},
    gameId: 'g1',
    sideToMove: 'w',
    status: 'ONGOING',
    endReason: null,
    error: null,
    loading: false,
    pending: false,
    playMove: vi.fn(),
    ...overrides,
  };
}

describe('App', () => {
  it('nennt die Seite am Zug, solange kein Zug läuft', () => {
    // ARRANGE
    mitZustand({ sideToMove: 'b' });

    // ACT
    render(<App />);

    // ASSERTIONS
    expect(screen.getByText('Schwarz am Zug')).toBeInTheDocument();
  });

  it('zeigt während eines laufenden Zuges die Wartemeldung statt der Seite am Zug', () => {
    // ARRANGE
    mitZustand({ pending: true });

    // ACT
    render(<App />);

    // ASSERTIONS
    expect(screen.getByText('Zug wird gespielt…')).toBeInTheDocument();
    expect(screen.queryByText('Weiß am Zug')).not.toBeInTheDocument();
  });

  it('zeigt bei beendeter Partie weder Wartemeldung noch Seite am Zug', () => {
    // ARRANGE
    mitZustand({ status: 'DRAW', endReason: 'STALEMATE' });

    // ACT
    render(<App />);

    // ASSERTIONS
    expect(screen.queryByText(/am Zug$/)).not.toBeInTheDocument();
    expect(screen.queryByText('Zug wird gespielt…')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Remis (Patt)');
  });

  it('zeigt einen Fehler als eigenen Absatz', () => {
    // ARRANGE
    mitZustand({ error: new Error('Dieser Zug ist nicht legal.') });

    // ACT
    render(<App />);

    // ASSERTIONS
    expect(screen.getByText('Fehler: Dieser Zug ist nicht legal.')).toBeInTheDocument();
  });
});

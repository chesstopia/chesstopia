import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayerRow } from '../PlayerRow';

describe('PlayerRow', () => {
  it('setzt data-active, wenn die Seite am Zug ist', () => {
    // ARRANGE & ACT
    render(<PlayerRow side="w" label="Du" active />);

    // ASSERTIONS
    expect(screen.getByTestId('player-row')).toHaveAttribute('data-active', 'true');
  });

  it('setzt data-active nicht, wenn die Seite nicht am Zug ist', () => {
    // ARRANGE & ACT
    render(<PlayerRow side="b" label="Gegner" active={false} />);

    // ASSERTIONS
    expect(screen.getByTestId('player-row')).not.toHaveAttribute('data-active', 'true');
  });

  it('zeigt Beschriftung und Hinweis', () => {
    // ARRANGE & ACT
    render(<PlayerRow side="b" label="Gegner" active={false} note="wartet auf Gegner" />);

    // ASSERTIONS
    expect(screen.getByText('Gegner')).toBeInTheDocument();
    expect(screen.getByText('wartet auf Gegner')).toBeInTheDocument();
  });

  it('zeigt bei Schach die Marke in einer Live-Region', () => {
    // ACT
    render(<PlayerRow side="w" label="Du · Weiß" active check />);

    // ASSERTIONS
    const badge = screen.getByText('Schach');
    expect(badge).toHaveAttribute('data-check-badge');
    expect(badge.closest('[aria-live="polite"]')).not.toBeNull();
  });

  it('hält die Live-Region auch ohne Schach bereit, aber leer', () => {
    // ACT
    const { container } = render(<PlayerRow side="w" label="Du · Weiß" active />);

    // ASSERTIONS
    expect(screen.queryByText('Schach')).not.toBeInTheDocument();
    expect(container.querySelector('[data-check-badge]')).toBeNull();
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull();
  });
});

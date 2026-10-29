import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MoveRecord } from '@chesstopia/openapi-client';
import { MoveList } from '../MoveList';

function record(moveNumber: number, from: { file: string; rank: string }, to: { file: string; rank: string }): MoveRecord {
  return { moveNumber, move: { from, to }, positionAfter: {}, playedAt: '2026-01-01T00:00:00Z' } as unknown as MoveRecord;
}

const e4 = record(1, { file: 'E', rank: 'TWO' }, { file: 'E', rank: 'FOUR' });
const e5 = record(2, { file: 'E', rank: 'SEVEN' }, { file: 'E', rank: 'FIVE' });

describe('MoveList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scrollt beim neuen Halbzug nur die Zugliste an das Ende, nicht die Seite', () => {
    // ARRANGE
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
    const { container, rerender } = render(<MoveList moves={[e4]} />);
    const viewport = container.querySelector('[data-slot="scroll-area-viewport"]')!;
    const setScrollTop = vi.fn();
    Object.defineProperty(viewport, 'scrollHeight', { configurable: true, get: () => 500 });
    Object.defineProperty(viewport, 'scrollTop', { configurable: true, get: () => 0, set: setScrollTop });

    // ACT
    rerender(<MoveList moves={[e4, e5]} />);

    // ASSERTIONS
    expect(setScrollTop).toHaveBeenCalledWith(500);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('zeigt Nummer und beide Halbzüge einer Zeile', () => {
    // ARRANGE & ACT
    render(<MoveList moves={[e4, e5]} />);

    // ASSERTIONS
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('e2–e4')).toBeInTheDocument();
    expect(screen.getByText('e7–e5')).toBeInTheDocument();
  });

  it('markiert nur den letzten Halbzug mit aria-current', () => {
    // ARRANGE & ACT
    render(<MoveList moves={[e4, e5]} />);

    // ASSERTIONS
    expect(screen.getByText('e7–e5')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('e2–e4')).not.toHaveAttribute('aria-current');
  });

  it('zeigt bei leerer Liste einen Hinweis', () => {
    // ARRANGE & ACT
    render(<MoveList moves={[]} />);

    // ASSERTIONS
    expect(screen.getByText('Noch keine Züge')).toBeInTheDocument();
  });
});

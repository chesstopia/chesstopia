import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameResultBanner } from '../GameResultBanner';

describe('GameResultBanner', () => {
  it('zeigt nichts bei laufender Partie', () => {
    // ACT
    const { container } = render(<GameResultBanner status="ONGOING" endReason={null} />);

    // ASSERTIONS
    expect(container).toBeEmptyDOMElement();
  });

  it('nennt den Sieger bei Schachmatt', () => {
    // ACT
    render(<GameResultBanner status="WHITE_WON" endReason="CHECKMATE" />);

    // ASSERTIONS
    expect(screen.getByText(/Weiß gewinnt/)).toBeInTheDocument();
  });

  it('nennt den Remisgrund beim Patt', () => {
    // ACT
    render(<GameResultBanner status="DRAW" endReason="STALEMATE" />);

    // ASSERTIONS
    expect(screen.getByText(/Patt/)).toBeInTheDocument();
  });
});

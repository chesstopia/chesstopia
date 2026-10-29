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

  it.each([
    ['FIFTY_MOVE_RULE', 'Remis (50-Züge-Regel)'],
    ['INSUFFICIENT_MATERIAL', 'Remis (ungenügendes Material)'],
    ['THREEFOLD_REPETITION', 'Remis (dreifache Stellungswiederholung)'],
  ])('nennt den Remisgrund %s', (endReason, erwartet) => {
    // ACT
    render(<GameResultBanner status="DRAW" endReason={endReason as never} />);

    // ASSERTIONS
    expect(screen.getByRole('status')).toHaveTextContent(erwartet);
  });

  it('nennt bei unbekanntem Status nur, dass die Partie beendet ist', () => {
    // ACT
    render(<GameResultBanner status={'ABANDONED' as never} endReason={null} />);

    // ASSERTIONS
    expect(screen.getByRole('status')).toHaveTextContent('Partie beendet');
  });

  it('hält die neutrale Zeile als einziges role=status-Element mit data-game-result', () => {
    // ACT
    render(<GameResultBanner status="BLACK_WON" endReason="CHECKMATE" role="w" />);

    // ASSERTIONS
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/^Schachmatt — Schwarz gewinnt$/);
    expect(status).toHaveAttribute('data-game-result');
  });

  it('zeigt die eigene Sicht groß und außerhalb der neutralen Zeile', () => {
    // ACT
    render(<GameResultBanner status="BLACK_WON" endReason="CHECKMATE" role="w" />);

    // ASSERTIONS
    const own = screen.getByText('Du hast verloren');
    expect(own).toBeInTheDocument();
    expect(screen.getByRole('status')).not.toContainElement(own);
  });

  it('zeigt Zuschauern keine eigene Zeile', () => {
    // ACT
    render(<GameResultBanner status="WHITE_WON" endReason="CHECKMATE" role={null} />);

    // ASSERTIONS
    expect(screen.queryByText(/Du hast/)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Schachmatt — Weiß gewinnt');
  });
});

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Chessboard } from './Chessboard';
import { parseFenBoard } from '@/lib/fen';

const INITIAL = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const EMPTY = '8/8/8/8/8/8/8/8 w - - 0 1';

/** Alle Figurensymbole im Dokument — die Komponenten tragen keine Rollen. */
function glyphs(container: HTMLElement): string[] {
  return [...container.querySelectorAll('span')].map((s) => s.textContent ?? '');
}

describe('Chessboard', () => {
  it('rendert 64 Felder', () => {
    const { container } = render(<Chessboard board={parseFenBoard(INITIAL)} />);

    expect(container.querySelector('div')?.children).toHaveLength(64);
  });

  it('rendert die Grundstellung mit 32 Figuren', () => {
    const { container } = render(<Chessboard board={parseFenBoard(INITIAL)} />);

    expect(glyphs(container)).toHaveLength(32);
    expect(screen.getAllByText('♟')).toHaveLength(8);
    expect(screen.getAllByText('♙')).toHaveLength(8);
    expect(screen.getAllByText('♔')).toHaveLength(1);
  });

  it('setzt Schwarz oben und Weiß unten', () => {
    const { container } = render(<Chessboard board={parseFenBoard(INITIAL)} />);
    const all = glyphs(container);

    // board[0] ist Reihe 8 — die schwarze Grundreihe. Der schwarze König steht
    // vor allen weißen Figuren, sonst ist das Brett gespiegelt.
    expect(all.indexOf('♚')).toBeLessThan(all.indexOf('♔'));
  });

  it('rendert ein leeres Brett ohne Figuren, aber mit allen Feldern', () => {
    const { container } = render(<Chessboard board={parseFenBoard(EMPTY)} />);

    expect(container.querySelector('div')?.children).toHaveLength(64);
    expect(glyphs(container)).toHaveLength(0);
  });

  it('rendert eine Teilstellung ohne die fehlenden Felder zu verlieren', () => {
    // Randfall aus ADR-0019: Ziffern in der FEN sind Leerfelder, keine Figuren.
    const { container } = render(
      <Chessboard board={parseFenBoard('4k3/8/8/8/8/8/8/4K3 w - - 0 1')} />
    );

    expect(container.querySelector('div')?.children).toHaveLength(64);
    expect(glyphs(container)).toEqual(['♚', '♔']);
  });
});

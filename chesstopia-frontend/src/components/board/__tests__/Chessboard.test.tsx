import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chessboard } from '../Chessboard';
import type { Board, PieceCode } from '@/lib/position';

/**
 * Baut ein Board aus 8 Reihen-Strings (Figurenbuchstaben, Ziffern = Leerfelder),
 * Reihe 8 zuerst. Testbequemlichkeit, kein Produktionscode.
 */
function board(rows: string[]): Board {
  const CHAR: Record<string, PieceCode> = {
    K: 'wK', Q: 'wQ', R: 'wR', B: 'wB', N: 'wN', P: 'wP',
    k: 'bK', q: 'bQ', r: 'bR', b: 'bB', n: 'bN', p: 'bP',
  };
  return rows.map((row) => {
    const squares: (PieceCode | null)[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) squares.push(...Array<null>(Number(ch)).fill(null));
      else squares.push(CHAR[ch] ?? null);
    }
    return squares;
  });
}

const INITIAL = board(['rnbqkbnr', 'pppppppp', '8', '8', '8', '8', 'PPPPPPPP', 'RNBQKBNR']);
const EMPTY = board(['8', '8', '8', '8', '8', '8', '8', '8']);
const KINGS_ONLY = board(['4k3', '8', '8', '8', '8', '8', '8', '4K3']);

/** Alle Figurensymbole im Dokument — die Komponenten tragen keine Rollen. */
function glyphs(container: HTMLElement): string[] {
  return [...container.querySelectorAll('span')].map((s) => s.textContent ?? '');
}

describe('Chessboard', () => {
  it('rendert 64 Felder', () => {
    // ACT
    const { container } = render(<Chessboard board={INITIAL} />);

    // ASSERTIONS
    expect(container.querySelector('div')?.children).toHaveLength(64);
  });

  it('rendert die Grundstellung mit 32 Figuren', () => {
    // ACT
    const { container } = render(<Chessboard board={INITIAL} />);

    // ASSERTIONS
    expect(glyphs(container)).toHaveLength(32);
    expect(screen.getAllByText('♟')).toHaveLength(8);
    expect(screen.getAllByText('♙')).toHaveLength(8);
    expect(screen.getAllByText('♔')).toHaveLength(1);
  });

  it('setzt Schwarz oben und Weiß unten', () => {
    // ACT
    const { container } = render(<Chessboard board={INITIAL} />);
    const all = glyphs(container);

    // ASSERTIONS
    // board[0] ist Reihe 8 — die schwarze Grundreihe. Der schwarze König steht
    // vor allen weißen Figuren, sonst ist das Brett gespiegelt.
    expect(all.indexOf('♚')).toBeLessThan(all.indexOf('♔'));
  });

  it('rendert ein leeres Brett ohne Figuren, aber mit allen Feldern', () => {
    // ACT
    const { container } = render(<Chessboard board={EMPTY} />);

    // ASSERTIONS
    expect(container.querySelector('div')?.children).toHaveLength(64);
    expect(glyphs(container)).toHaveLength(0);
  });

  it('rendert eine Teilstellung ohne die fehlenden Felder zu verlieren', () => {
    // Randfall aus ADR-0019: leere Felder in einer Reihe zählen nicht als Figuren.

    // ACT
    const { container } = render(<Chessboard board={KINGS_ONLY} />);

    // ASSERTIONS
    expect(container.querySelector('div')?.children).toHaveLength(64);
    expect(glyphs(container)).toEqual(['♚', '♔']);
  });
});

describe('Chessboard — Figuren bewegen', () => {
  function setup(props: Partial<Parameters<typeof Chessboard>[0]> = {}) {
    const onMove = vi.fn();
    const user = userEvent.setup();
    render(
      <Chessboard board={INITIAL} sideToMove="w" onMove={onMove} {...props} />
    );
    return { onMove, user };
  }

  /** Aufnehmen, überfahren, ablegen — die Geste in drei Zeigerschritten. */
  async function drag(
    user: ReturnType<typeof userEvent.setup>,
    from: HTMLElement,
    to: HTMLElement
  ) {
    await user.pointer([
      { keys: '[MouseLeft>]', target: from },
      { target: to },
      { keys: '[/MouseLeft]', target: to },
    ]);
  }

  it('meldet den gezogenen Zug mit Start- und Zielfeld', async () => {
    // ARRANGE
    const { onMove, user } = setup();

    // ACT
    await drag(user, screen.getByLabelText('e2'), screen.getByLabelText('e4'));

    // ASSERTIONS
    expect(onMove).toHaveBeenCalledExactlyOnceWith('e2', 'e4');
  });

  it('meldet nichts, wenn die Figur auf ihrem Feld abgelegt wird', async () => {
    // ARRANGE
    const { onMove, user } = setup();

    // ACT
    await drag(user, screen.getByLabelText('e2'), screen.getByLabelText('e2'));

    // ASSERTIONS
    expect(onMove).not.toHaveBeenCalled();
  });

  it('lässt die Figur der wartenden Seite nicht anfassen', async () => {
    // Sonst erzeugt die Oberfläche einen Zug, den das Backend nur ablehnen kann.

    // ARRANGE
    const { onMove, user } = setup();

    // ACT
    await drag(user, screen.getByLabelText('e7'), screen.getByLabelText('e5'));

    // ASSERTIONS
    expect(onMove).not.toHaveBeenCalled();
  });

  it('lässt ein leeres Feld nicht anfassen', async () => {
    // ARRANGE
    const { onMove, user } = setup();

    // ACT
    await drag(user, screen.getByLabelText('e4'), screen.getByLabelText('e5'));

    // ASSERTIONS
    expect(onMove).not.toHaveBeenCalled();
  });

  it('meldet nichts, während ein Zug noch läuft', async () => {
    // ARRANGE
    const { onMove, user } = setup({ disabled: true });

    // ACT
    await drag(user, screen.getByLabelText('e2'), screen.getByLabelText('e4'));

    // ASSERTIONS
    expect(onMove).not.toHaveBeenCalled();
  });

  it('bricht ab, wenn außerhalb des Bretts losgelassen wird', async () => {
    // Und lässt danach nichts kleben: Der nächste Zeigerdruck auf ein Feld darf
    // nicht als Abschluss des alten Zuges gelten.

    // ARRANGE
    const { onMove, user } = setup();

    // ACT & ASSERTIONS
    await user.pointer([
      { keys: '[MouseLeft>]', target: screen.getByLabelText('e2') },
      { keys: '[/MouseLeft]', target: document.body },
    ]);
    expect(onMove).not.toHaveBeenCalled();

    await user.pointer({ target: screen.getByLabelText('e4') });
    await user.pointer({ keys: '[/MouseLeft]', target: screen.getByLabelText('e4') });
    expect(onMove).not.toHaveBeenCalled();
  });

  it('hebt das aufgenommene Feld hervor und lässt es beim Ablegen wieder los', async () => {
    // ARRANGE
    const { user } = setup();
    const from = screen.getByLabelText('e2');

    // ACT & ASSERTIONS
    await user.pointer({ keys: '[MouseLeft>]', target: from });
    expect(from.className).toContain('ring-sky-400');

    await user.pointer({ keys: '[/MouseLeft]', target: screen.getByLabelText('e4') });
    expect(from.className).not.toContain('ring-sky-400');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('Chessboard — Figuren bewegen', () => {
  function setup(props: Partial<Parameters<typeof Chessboard>[0]> = {}) {
    const onMove = vi.fn();
    const user = userEvent.setup();
    render(
      <Chessboard board={parseFenBoard(INITIAL)} sideToMove="w" onMove={onMove} {...props} />
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
    const { onMove, user } = setup();

    await drag(user, screen.getByLabelText('e2'), screen.getByLabelText('e4'));

    expect(onMove).toHaveBeenCalledExactlyOnceWith('e2', 'e4');
  });

  it('meldet nichts, wenn die Figur auf ihrem Feld abgelegt wird', async () => {
    const { onMove, user } = setup();

    await drag(user, screen.getByLabelText('e2'), screen.getByLabelText('e2'));

    expect(onMove).not.toHaveBeenCalled();
  });

  it('lässt die Figur der wartenden Seite nicht anfassen', async () => {
    // Sonst erzeugt die Oberfläche einen Zug, den das Backend nur ablehnen kann.
    const { onMove, user } = setup();

    await drag(user, screen.getByLabelText('e7'), screen.getByLabelText('e5'));

    expect(onMove).not.toHaveBeenCalled();
  });

  it('lässt ein leeres Feld nicht anfassen', async () => {
    const { onMove, user } = setup();

    await drag(user, screen.getByLabelText('e4'), screen.getByLabelText('e5'));

    expect(onMove).not.toHaveBeenCalled();
  });

  it('meldet nichts, während ein Zug noch läuft', async () => {
    const { onMove, user } = setup({ disabled: true });

    await drag(user, screen.getByLabelText('e2'), screen.getByLabelText('e4'));

    expect(onMove).not.toHaveBeenCalled();
  });

  it('bricht ab, wenn außerhalb des Bretts losgelassen wird', async () => {
    // Und lässt danach nichts kleben: Der nächste Zeigerdruck auf ein Feld darf
    // nicht als Abschluss des alten Zuges gelten.
    const { onMove, user } = setup();

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
    const { user } = setup();
    const from = screen.getByLabelText('e2');

    await user.pointer({ keys: '[MouseLeft>]', target: from });
    expect(from.className).toContain('ring-sky-400');

    await user.pointer({ keys: '[/MouseLeft]', target: screen.getByLabelText('e4') });
    expect(from.className).not.toContain('ring-sky-400');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chessboard } from '../Chessboard';
import { FLACH } from '../theme/boardTheme';
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

/** Alle Figurencodes im Dokument — die Komponenten tragen keine Rollen. */
function glyphs(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-piece]')].map((s) => s.getAttribute('data-piece') ?? '');
}

describe('Chessboard', () => {
  describe('Darstellung', () => {
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
      expect(glyphs(container).filter((g) => g === 'bP')).toHaveLength(8);
      expect(glyphs(container).filter((g) => g === 'wP')).toHaveLength(8);
      expect(glyphs(container).filter((g) => g === 'wK')).toHaveLength(1);
    });

    it('setzt Schwarz oben und Weiß unten', () => {
      // ACT
      const { container } = render(<Chessboard board={INITIAL} />);
      const all = glyphs(container);

      // ASSERTIONS
      // board[0] ist Reihe 8 — die schwarze Grundreihe. Der schwarze König steht
      // vor allen weißen Figuren, sonst ist das Brett gespiegelt.
      expect(all.indexOf('bK')).toBeLessThan(all.indexOf('wK'));
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
      expect(glyphs(container)).toEqual(['bK', 'wK']);
    });
  });

  describe('Figuren bewegen', () => {
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
      expect(from.style.boxShadow).toContain(FLACH.colors.dragSource);

      await user.pointer({ keys: '[/MouseLeft]', target: screen.getByLabelText('e4') });
      expect(from.style.boxShadow).toBe('');
    });
  });

  describe('Ausrichtung und Markierung', () => {
    const order = (container: HTMLElement) =>
      [...container.querySelectorAll('[data-square]')].map((e) => e.getAttribute('data-square'));
    const texts = (container: HTMLElement, attr: string) =>
      [...container.querySelectorAll(`[${attr}]`)].map((e) => e.textContent);

    it('orientation b rendert h1 zuerst und a8 zuletzt', () => {
      // ACT
      const black = order(render(<Chessboard board={INITIAL} orientation="b" />).container);
      const white = order(render(<Chessboard board={INITIAL} orientation="w" />).container);

      // ASSERTIONS
      expect(black[0]).toBe('h1');
      expect(black[63]).toBe('a8');
      expect(white[0]).toBe('a8');
      expect(white[63]).toBe('h1');
    });

    it('Koordinaten folgen der Ausrichtung', () => {
      // ACT
      const white = render(<Chessboard board={INITIAL} orientation="w" />).container;
      const black = render(<Chessboard board={INITIAL} orientation="b" />).container;

      // ASSERTIONS
      expect(texts(white, 'data-coord-file')).toEqual([...'abcdefgh']);
      expect(texts(white, 'data-coord-rank')).toEqual([...'87654321']);
      expect(texts(black, 'data-coord-file')).toEqual([...'hgfedcba']);
      expect(texts(black, 'data-coord-rank')).toEqual([...'12345678']);
    });

    it('markiert Start- und Zielfeld des letzten Zugs', () => {
      // ACT
      const { container } = render(
        <Chessboard board={INITIAL} lastMove={{ from: 'e2', to: 'e4' }} />
      );

      // ASSERTIONS
      const marked = [...container.querySelectorAll('[data-last-move]')].map((e) =>
        e.getAttribute('data-square')
      );
      expect(marked.sort()).toEqual(['e2', 'e4']);
    });

    it('Ziehen funktioniert auf dem gedrehten Brett', async () => {
      // ARRANGE
      const onMove = vi.fn();
      const user = userEvent.setup();
      render(<Chessboard board={INITIAL} sideToMove="b" orientation="b" onMove={onMove} />);

      // ACT
      await user.pointer([
        { keys: '[MouseLeft>]', target: screen.getByLabelText('e7') },
        { target: screen.getByLabelText('e5') },
        { keys: '[/MouseLeft]', target: screen.getByLabelText('e5') },
      ]);

      // ASSERTIONS
      expect(onMove).toHaveBeenCalledExactlyOnceWith('e7', 'e5');
    });

    it('das Geisterbild übernimmt die Feldgröße beim Aufnehmen', async () => {
      // ARRANGE
      const rect = vi
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue({ width: 100, height: 100 } as DOMRect);
      const user = userEvent.setup();
      const { container } = render(<Chessboard board={INITIAL} />);

      // ACT
      await user.pointer({ keys: '[MouseLeft>]', target: screen.getByLabelText('e2') });

      // ASSERTIONS
      const ghost = container.querySelector('[aria-hidden] img') as HTMLElement;
      expect(ghost.style.width).toBe('90px');
      rect.mockRestore();
    });
  });
});

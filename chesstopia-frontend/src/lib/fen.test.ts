import { describe, it, expect } from 'vitest';
import { parseFenBoard } from './fen';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';

describe('parseFenBoard', () => {

  describe('Ausgabe-Struktur', () => {
    it('gibt immer genau 8 Ränge zurück', () => {
      expect(parseFenBoard(STARTING_FEN)).toHaveLength(8);
    });

    it('jeder Rang hat genau 8 Felder', () => {
      const board = parseFenBoard(STARTING_FEN);
      board.forEach((rank) => expect(rank).toHaveLength(8));
    });
  });

  describe('Startposition', () => {
    it('Rang 0 (8. Reihe) enthält die schwarzen Offiziere', () => {
      const board = parseFenBoard(STARTING_FEN);
      expect(board[0]).toEqual(['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR']);
    });

    it('Rang 1 (7. Reihe) enthält acht schwarze Bauern', () => {
      const board = parseFenBoard(STARTING_FEN);
      expect(board[1]).toEqual(Array(8).fill('bP'));
    });

    it('Ränge 2–5 sind komplett leer', () => {
      const board = parseFenBoard(STARTING_FEN);
      for (let rank = 2; rank <= 5; rank++) {
        expect(board[rank]).toEqual(Array(8).fill(null));
      }
    });

    it('Rang 6 (2. Reihe) enthält acht weiße Bauern', () => {
      const board = parseFenBoard(STARTING_FEN);
      expect(board[6]).toEqual(Array(8).fill('wP'));
    });

    it('Rang 7 (1. Reihe) enthält die weißen Offiziere', () => {
      const board = parseFenBoard(STARTING_FEN);
      expect(board[7]).toEqual(['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']);
    });
  });

  describe('FEN-Metadaten werden ignoriert', () => {
    it('liefert dasselbe Ergebnis egal ob Metadaten vorhanden sind', () => {
      const withMeta = parseFenBoard(STARTING_FEN);
      const boardOnly = parseFenBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
      expect(withMeta).toEqual(boardOnly);
    });
  });

  describe('Leere Felder (Ziffern im FEN)', () => {
    it('"8/8/..." ergibt 8×8 null', () => {
      const board = parseFenBoard(EMPTY_BOARD_FEN);
      expect(board).toEqual(Array(8).fill(Array(8).fill(null)));
    });

    it('gemischter Rang "r1bqkb1r" wird korrekt geparst', () => {
      const board = parseFenBoard('r1bqkb1r/8/8/8/8/8/8/8');
      expect(board[0]).toEqual(['bR', null, 'bB', 'bQ', 'bK', 'bB', null, 'bR']);
    });

    it('Rang "4k3" — Ziffer vorne und hinten', () => {
      const board = parseFenBoard('8/8/8/8/4k3/8/8/8');
      expect(board[4]).toEqual([null, null, null, null, 'bK', null, null, null]);
    });

    it('mehrere Einzel-Ziffern addieren sich korrekt ("1111111P")', () => {
      const board = parseFenBoard('8/8/8/8/8/8/8/1111111P');
      expect(board[7]).toEqual([null, null, null, null, null, null, null, 'wP']);
    });
  });

  describe('Alle 12 Figurentypen', () => {
    it('alle weißen Figurentypen werden korrekt gemappt', () => {
      const board = parseFenBoard('8/8/8/8/8/8/8/KQRBNP');
      expect(board[7].slice(0, 6)).toEqual(['wK', 'wQ', 'wR', 'wB', 'wN', 'wP']);
    });

    it('alle schwarzen Figurentypen werden korrekt gemappt', () => {
      const board = parseFenBoard('kqrbnp/8/8/8/8/8/8/8');
      expect(board[0].slice(0, 6)).toEqual(['bK', 'bQ', 'bR', 'bB', 'bN', 'bP']);
    });
  });

  describe('Unbekannte Zeichen', () => {
    it('unbekanntes Zeichen im FEN wird als null behandelt', () => {
      const board = parseFenBoard('X7/8/8/8/8/8/8/8');
      expect(board[0][0]).toBeNull();
    });
  });
});

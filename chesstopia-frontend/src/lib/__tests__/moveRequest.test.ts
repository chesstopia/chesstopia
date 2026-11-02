import { describe, expect, it } from 'vitest';
import type { Board } from '../position';
import { isPromotion, toMoveRequest } from '../moveRequest';

const emptyBoard = (): Board => Array.from({ length: 8 }, () => Array(8).fill(null));
const boardWith = (rankIdx: number, fileIdx: number, piece: Board[number][number]): Board => {
  const board = emptyBoard();
  board[rankIdx][fileIdx] = piece;
  return board;
};

describe('moveRequest', () => {
  describe('isPromotion', () => {
    it('erkennt einen weißen Bauern auf Reihe 8', () => {
      // ARRANGE
      const board = boardWith(1, 4, 'wP');

      // ACT
      const result = isPromotion(board, 'e7', 'e8');

      // ASSERTIONS
      expect(result).toBe(true);
    });

    it('erkennt einen schwarzen Bauern auf Reihe 1', () => {
      // ARRANGE
      const board = boardWith(6, 4, 'bP');

      // ACT
      const result = isPromotion(board, 'e2', 'e1');

      // ASSERTIONS
      expect(result).toBe(true);
    });

    it('wertet einen Bauernzug ohne Grundreihe nicht als Umwandlung', () => {
      // ARRANGE
      const board = boardWith(6, 4, 'wP');

      // ACT
      const result = isPromotion(board, 'e2', 'e4');

      // ASSERTIONS
      expect(result).toBe(false);
    });

    it('wertet einen Turm auf Reihe 8 nicht als Umwandlung', () => {
      // ARRANGE
      const board = boardWith(1, 0, 'wR');

      // ACT
      const result = isPromotion(board, 'a7', 'a8');

      // ASSERTIONS
      expect(result).toBe(false);
    });

    it('wertet einen weißen Bauern auf Reihe 1 nicht als Umwandlung', () => {
      // ARRANGE
      const board = boardWith(6, 4, 'wP');

      // ACT
      const result = isPromotion(board, 'e2', 'e1');

      // ASSERTIONS
      expect(result).toBe(false);
    });
  });

  describe('toMoveRequest', () => {
    it('wandelt einen weißen Bauern auf Reihe 8 in die gewählte Dame um', () => {
      // ARRANGE
      const board = boardWith(1, 4, 'wP');

      // ACT
      const move = toMoveRequest(board, 'e7', 'e8', 'QUEEN');

      // ASSERTIONS
      expect(move).toEqual({ from: { file: 'E', rank: 'SEVEN' }, to: { file: 'E', rank: 'EIGHT' }, promotion: 'QUEEN' });
    });

    it('wandelt einen schwarzen Bauern auf Reihe 1 in die gewählte Figur um', () => {
      // ARRANGE
      const board = boardWith(6, 4, 'bP');

      // ACT
      const move = toMoveRequest(board, 'e2', 'e1', 'QUEEN');

      // ASSERTIONS
      expect(move.promotion).toBe('QUEEN');
    });

    it.each(['ROOK', 'BISHOP', 'KNIGHT'] as const)('übernimmt die Unterverwandlung %s', (piece) => {
      // ARRANGE
      const board = boardWith(1, 4, 'wP');

      // ACT
      const move = toMoveRequest(board, 'e7', 'e8', piece);

      // ASSERTIONS
      expect(move.promotion).toBe(piece);
    });

    it('setzt ohne gewählte Figur keine Dame ein', () => {
      // ARRANGE
      const board = boardWith(1, 4, 'wP');

      // ACT
      const move = toMoveRequest(board, 'e7', 'e8');

      // ASSERTIONS
      expect(move.promotion).toBeUndefined();
    });

    it('lässt eine Zielfigur bei einem Zug ohne Umwandlung weg', () => {
      // ARRANGE
      const board = boardWith(6, 4, 'wP');

      // ACT
      const move = toMoveRequest(board, 'e2', 'e4', 'QUEEN');

      // ASSERTIONS
      expect(move).toEqual({ from: { file: 'E', rank: 'TWO' }, to: { file: 'E', rank: 'FOUR' }, promotion: undefined });
    });

    it('wandelt einen Turm auf Reihe 8 nicht um', () => {
      // ARRANGE
      const board = boardWith(1, 0, 'wR');

      // ACT
      const move = toMoveRequest(board, 'a7', 'a8', 'QUEEN');

      // ASSERTIONS
      expect(move.promotion).toBeUndefined();
    });
  });
});

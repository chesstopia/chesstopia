import { test, expect } from '@playwright/test';
import { emptyBoard, parseBoardRows, renderBoard } from '../board';

const GRUNDSTELLUNG = [
  '  8  r n b q k b n r',
  '  7  p p p p p p p p',
  '  6  . . . . . . . .',
  '  5  . . . . . . . .',
  '  4  . . . . . . . .',
  '  3  . . . . . . . .',
  '  2  P P P P P P P P',
  '  1  R N B Q K B N R',
];

test.describe('board', () => {
  test('liest die Grundstellung Feld für Feld', () => {
    // ACT
    const board = parseBoardRows(GRUNDSTELLUNG);

    // ASSERTIONS
    expect(board.e1).toBe('wK');
    expect(board.d8).toBe('bQ');
    expect(board.a2).toBe('wP');
    expect(board.e4).toBeNull();
    expect(Object.keys(board)).toHaveLength(64);
  });

  test('rendert zurück in genau die Zeilen, aus denen gelesen wurde', () => {
    // ACT
    const wieder = renderBoard(parseBoardRows(GRUNDSTELLUNG));

    // ASSERTIONS
    expect(wieder).toBe(GRUNDSTELLUNG.join('\n'));
  });

  test('ein leeres Brett hat 64 Felder und keine Figur', () => {
    // ACT
    const board = emptyBoard();

    // ASSERTIONS
    expect(Object.keys(board)).toHaveLength(64);
    expect(Object.values(board).every((piece) => piece === null)).toBe(true);
  });

  test('lehnt eine Reihe mit zu wenigen Feldern ab', () => {
    // ARRANGE
    const kaputt = [...GRUNDSTELLUNG];
    kaputt[3] = '  5  . . . . . . .';

    // ACT & ASSERTIONS
    expect(() => parseBoardRows(kaputt)).toThrow(/Reihe 5/);
  });

  test('lehnt ein unbekanntes Figurensymbol ab', () => {
    // ARRANGE
    const kaputt = [...GRUNDSTELLUNG];
    kaputt[3] = '  5  . . . x . . . .';

    // ACT & ASSERTIONS
    expect(() => parseBoardRows(kaputt)).toThrow(/x/);
  });

  test('lehnt eine falsche Reihenzahl ab', () => {
    // ACT & ASSERTIONS
    expect(() => parseBoardRows(GRUNDSTELLUNG.slice(0, 7))).toThrow(/8 Reihen/);
  });
});

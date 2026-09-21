import { test, expect } from '@playwright/test';
import { parseCase } from '../parser';
import { renderBoard } from '../board';

const BRETT = [
  '     BOARD',
  '  8  r n b q k b n r',
  '  7  p p p p p p p p',
  '  6  . . . . . . . .',
  '  5  . . . . . . . .',
  '  4  . . . . P . . .',
  '  3  . . . . . . . .',
  '  2  P P P P . P P P',
  '  1  R N B Q K B N R',
  '     a b c d e f g h',
].join('\n');

const VOLLSTAENDIG = `description = ein Bauernzug
moves       = e2e4
turn        = black

${BRETT}
`;

test.describe('parser', () => {
  test('liest Kopf und Brett eines vollständigen Falls', () => {
    // ACT
    const fall = parseCase(VOLLSTAENDIG, 'grundzug/legaler-zug.case');

    // ASSERTIONS
    expect(fall.description).toBe('ein Bauernzug');
    expect(fall.moves).toEqual([{ from: 'e2', to: 'e4' }]);
    expect(fall.turn).toBe('black');
    expect(fall.banner).toBeNull();
    expect(fall.error).toBeNull();
    expect(fall.locked).toBeNull();
    expect(renderBoard(fall.board)).toContain('  4  . . . . P . . .');
  });

  test('liest eine Zugfolge in Reihenfolge', () => {
    // ARRANGE
    const raw = VOLLSTAENDIG.replace('moves       = e2e4', 'moves       = e2e4 e7e5 g1f3');

    // ACT
    const fall = parseCase(raw, 'x.case');

    // ASSERTIONS
    expect(fall.moves).toEqual([
      { from: 'e2', to: 'e4' },
      { from: 'e7', to: 'e5' },
      { from: 'g1', to: 'f3' },
    ]);
  });

  test('liest Banner, Fehlertext und Sperrgeste', () => {
    // ARRANGE
    const raw = VOLLSTAENDIG
      .replace('turn        = black', 'banner      = Remis (Patt)\nerror       = Dieser Zug ist nicht legal.\nlocked      = d2 d4');

    // ACT
    const fall = parseCase(raw, 'x.case');

    // ASSERTIONS
    expect(fall.banner).toBe('Remis (Patt)');
    expect(fall.turn).toBeNull();
    expect(fall.error).toBe('Dieser Zug ist nicht legal.');
    expect(fall.locked).toEqual({ from: 'd2', to: 'd4' });
  });

  test('nennt den Dateinamen, wenn ein Fall nicht parsebar ist', () => {
    // ACT & ASSERTIONS
    expect(() => parseCase('description = leer\n', 'remis/patt.case')).toThrow(
      /Testfall 'remis\/patt\.case' nicht parsebar/,
    );
  });

  test('lehnt einen Fall ohne Zugfolge ab', () => {
    // ARRANGE
    const raw = VOLLSTAENDIG.replace('moves       = e2e4\n', '');

    // ACT & ASSERTIONS
    expect(() => parseCase(raw, 'x.case')).toThrow(/moves/);
  });

  test('lehnt turn und banner nebeneinander ab', () => {
    // ARRANGE
    const raw = VOLLSTAENDIG.replace('turn        = black', 'turn        = black\nbanner      = Remis');

    // ACT & ASSERTIONS
    expect(() => parseCase(raw, 'x.case')).toThrow(/genau eines von `turn` und `banner`/);
  });

  test('lehnt einen Fall ohne turn und ohne banner ab', () => {
    // ARRANGE
    const raw = VOLLSTAENDIG.replace('turn        = black\n', '');

    // ACT & ASSERTIONS
    expect(() => parseCase(raw, 'x.case')).toThrow(/genau eines von `turn` und `banner`/);
  });

  test('lehnt einen Halbzug ab, der kein Feldpaar ist', () => {
    // ARRANGE
    const raw = VOLLSTAENDIG.replace('e2e4', 'e2e9');

    // ACT & ASSERTIONS
    expect(() => parseCase(raw, 'x.case')).toThrow(/e2e9/);
  });

  test('lehnt einen unbekannten Schlüssel ab', () => {
    // ARRANGE
    const raw = VOLLSTAENDIG.replace('turn        = black', 'turn        = black\nruleset     = standard');

    // ACT & ASSERTIONS
    expect(() => parseCase(raw, 'x.case')).toThrow(/ruleset/);
  });
});

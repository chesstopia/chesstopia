import { gruppe, pruefung, expect } from '../../testlauf';
import { figur, leereStellung } from '../schach';
import { brettbild, liesReihen, zeichne } from '../brettbild';

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

gruppe('brettbild', () => {
  pruefung('liest die Grundstellung Feld für Feld', () => {
    // ACT
    const s = liesReihen(GRUNDSTELLUNG);

    // ASSERTIONS
    expect(s.e1).toEqual(figur('weiss', 'koenig'));
    expect(s.d8).toEqual(figur('schwarz', 'dame'));
    expect(s.a2).toEqual(figur('weiss', 'bauer'));
    expect(s.e4).toBeNull();
    expect(Object.keys(s)).toHaveLength(64);
  });

  pruefung('zeichnet zurück in genau die Zeilen, aus denen gelesen wurde', () => {
    // ACT
    const wieder = zeichne(liesReihen(GRUNDSTELLUNG));

    // ASSERTIONS
    expect(wieder).toBe(GRUNDSTELLUNG.join('\n'));
  });

  pruefung('eine leere Stellung hat 64 Felder und keine Figur', () => {
    // ACT
    const s = leereStellung();

    // ASSERTIONS
    expect(Object.keys(s)).toHaveLength(64);
    expect(Object.values(s).every((f) => f === null)).toBe(true);
  });

  pruefung('lehnt eine Reihe mit zu wenigen Feldern ab', () => {
    // ARRANGE
    const kaputt = [...GRUNDSTELLUNG];
    kaputt[3] = '  5  . . . . . . .';

    // ACT & ASSERTIONS
    expect(() => liesReihen(kaputt)).toThrow(/Reihe 5/);
  });

  pruefung('lehnt ein unbekanntes Figurensymbol ab', () => {
    // ARRANGE
    const kaputt = [...GRUNDSTELLUNG];
    kaputt[3] = '  5  . . . x . . . .';

    // ACT & ASSERTIONS
    expect(() => liesReihen(kaputt)).toThrow(/x/);
  });

  pruefung('lehnt eine falsche Reihenzahl ab', () => {
    // ACT & ASSERTIONS
    expect(() => liesReihen(GRUNDSTELLUNG.slice(0, 7))).toThrow(/8 Reihen/);
  });

  pruefung('brettbild liest einen Block mit Kopf- und Fußzeile', () => {
    // ARRANGE
    const text = ['     BOARD', ...GRUNDSTELLUNG, '     a b c d e f g h'].join('\n');

    // ACT
    const s = brettbild(text);

    // ASSERTIONS
    expect(s).toEqual(liesReihen(GRUNDSTELLUNG));
  });
});

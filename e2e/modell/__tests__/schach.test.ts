import { gruppe, pruefung, expect } from '../../testlauf';
import { FELDER, gegner, zug } from '../schach';

gruppe('schach', () => {
  pruefung('zug liest die Kurzform', () => {
    // ACT
    const ergebnis = zug('e2e4');

    // ASSERTIONS
    expect(ergebnis).toEqual({ von: 'e2', nach: 'e4' });
  });

  pruefung('zug lehnt eine Kurzform ab, die kein Feldpaar ist', () => {
    // ACT & ASSERTIONS
    expect(() => zug('e2e9')).toThrow('kein Feldpaar: e2e9');
    expect(() => zug('e2e')).toThrow('kein Feldpaar: e2e');
  });

  pruefung('FELDER hat 64 Felder in Brettreihenfolge', () => {
    // ASSERTIONS
    expect(FELDER).toHaveLength(64);
    expect(FELDER[0]).toBe('a8');
    expect(FELDER[63]).toBe('h1');
  });

  pruefung('gegner tauscht die Farbe', () => {
    // ASSERTIONS
    expect(gegner('weiss')).toBe('schwarz');
    expect(gegner('schwarz')).toBe('weiss');
  });
});

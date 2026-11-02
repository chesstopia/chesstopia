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

  pruefung('zug liest das Umwandlungssuffix', () => {
    // ACT
    const ergebnis = zug('c7c8n');

    // ASSERTIONS
    expect(ergebnis).toEqual({ von: 'c7', nach: 'c8', umwandlung: 'springer' });
  });

  pruefung('zug ordnet jedem Suffix seine Figur zu', () => {
    // ACT
    const figuren = ['q', 'r', 'b', 'n'].map((s) => zug(`a7a8${s}`).umwandlung);

    // ASSERTIONS
    expect(figuren).toEqual(['dame', 'turm', 'laeufer', 'springer']);
  });

  pruefung('zug ohne Suffix trägt keinen Umwandlungsschlüssel', () => {
    // ACT
    const ergebnis = zug('e2e4');

    // ASSERTIONS
    expect('umwandlung' in ergebnis).toBe(false);
  });

  pruefung('zug lehnt ein unbekanntes oder doppeltes Suffix ab', () => {
    // ACT & ASSERTIONS
    expect(() => zug('c7c8x')).toThrow('kein Feldpaar: c7c8x');
    expect(() => zug('c7c8qq')).toThrow('kein Feldpaar: c7c8qq');
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

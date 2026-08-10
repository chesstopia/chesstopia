// Sprosse 1 — Neu: Aus einer Zeichenkette wird eine Liste von Feldern.
//
// Noch keine Anzeige, kein Dokument, kein React. Eine reine Funktion:
// gleiche Eingabe, gleiche Ausgabe, keine Wirkung nach außen.
import { describe, it, expect } from 'vitest';

function reiheLesen(reihe: string): (string | null)[] {
  const felder: (string | null)[] = [];
  for (const zeichen of reihe) {
    if (/\d/.test(zeichen)) {
      // Eine Ziffer ist keine Figur, sondern eine Anzahl leerer Felder.
      for (let i = 0; i < Number(zeichen); i++) felder.push(null);
    } else {
      felder.push(zeichen);
    }
  }
  return felder;
}

describe('Sprosse 1 — eine Reihe lesen', () => {
  it('eine volle Reihe hat acht Felder', () => {
    expect(reiheLesen('rnbqkbnr')).toHaveLength(8);
  });

  it('eine Ziffer steht fuer leere Felder, nicht fuer eine Figur', () => {
    expect(reiheLesen('8')).toEqual([null, null, null, null, null, null, null, null]);
  });

  it('gemischt: Figur, Luecke, Figur', () => {
    expect(reiheLesen('r6k')).toEqual(['r', null, null, null, null, null, null, 'k']);
  });
});

// Sprosse 2 — Neu: Aus der Liste werden acht Reihen.
//
// Damit kommt die Reihenfolge ins Spiel: FEN beginnt oben, also ist brett[0]
// die achte Reihe. Wer das verwechselt, sieht ein gespiegeltes Brett und
// keinen Fehler.
import { describe, it, expect } from 'vitest';

function reiheLesen(reihe: string): (string | null)[] {
  const felder: (string | null)[] = [];
  for (const zeichen of reihe) {
    if (/\d/.test(zeichen)) {
      for (let i = 0; i < Number(zeichen); i++) felder.push(null);
    } else {
      felder.push(zeichen);
    }
  }
  return felder;
}

function brettLesen(fen: string): (string | null)[][] {
  return fen.split(' ')[0].split('/').map(reiheLesen);
}

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('Sprosse 2 — ein Brett lesen', () => {
  it('acht Reihen', () => {
    expect(brettLesen(START)).toHaveLength(8);
  });

  it('brett[0] ist Reihe 8 — dort steht Schwarz', () => {
    expect(brettLesen(START)[0][4]).toBe('k');
  });

  it('brett[7] ist Reihe 1 — dort steht Weiss', () => {
    expect(brettLesen(START)[7][4]).toBe('K');
  });
});

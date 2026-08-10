// Das Ergebnis der Sprossen 1 und 2, einmal abgelegt.
//
// Ab Sprosse 3 geht es nicht mehr ums Lesen, sondern ums Anzeigen. Die
// Sprossen ab dort importieren von hier, damit in ihren Dateien nur das
// steht, was sie neu zeigen.
export const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type Feld = string | null;
export type Brett = Feld[][];

function reiheLesen(reihe: string): Feld[] {
  const felder: Feld[] = [];
  for (const zeichen of reihe) {
    if (/\d/.test(zeichen)) {
      for (let i = 0; i < Number(zeichen); i++) felder.push(null);
    } else {
      felder.push(zeichen);
    }
  }
  return felder;
}

export function brettLesen(fen: string): Brett {
  return fen.split(' ')[0].split('/').map(reiheLesen);
}

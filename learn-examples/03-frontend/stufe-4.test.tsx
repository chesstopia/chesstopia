// Sprosse 4 — Neu: Dieselben Knoten als Beschreibung statt als Anweisungsfolge.
//
// Sprosse 3 sagte, *was zu tun ist*: Knoten erzeugen, fuellen, anhaengen.
// Hier steht nur noch, *wie es aussehen soll*. Wer die Knoten daraus baut,
// ist React — und weil es sie gebaut hat, kann es sie auch ersetzen.
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { brettLesen, START, type Brett } from './brett';

function Brettflaeche({ brett }: { brett: Brett }) {
  return (
    <div>
      {brett.flatMap((reihe, r) =>
        reihe.map((feld, f) => <div key={`${r}-${f}`}>{feld ?? ''}</div>)
      )}
    </div>
  );
}

function zeichnen(brett: Brett): HTMLElement {
  const behaelter = document.createElement('div');
  act(() => {
    createRoot(behaelter).render(<Brettflaeche brett={brett} />);
  });
  return behaelter.firstElementChild as HTMLElement;
}

describe('Sprosse 4 — beschreiben statt anweisen', () => {
  it('dasselbe Ergebnis wie von Hand: vierundsechzig Knoten', () => {
    expect(zeichnen(brettLesen(START)).children).toHaveLength(64);
  });

  it('der Knoten an Stelle 4 traegt den schwarzen Koenig', () => {
    expect(zeichnen(brettLesen(START)).children[4].textContent).toBe('k');
  });

  it('eine andere Stellung ist eine andere Beschreibung, kein anderer Ablauf', () => {
    const nachE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
    const flaeche = zeichnen(brettLesen(nachE4));
    expect(flaeche.children[36].textContent).toBe('P'); // e4 besetzt
    expect(flaeche.children[52].textContent).toBe(''); // e2 leer
    // Niemand hat die beiden Knoten angefasst. Es wurde eine andere
    // Stellung beschrieben, und der Rest ist Ableitung.
  });
});

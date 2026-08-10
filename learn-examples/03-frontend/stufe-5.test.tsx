// Sprosse 5 — Neu: Die Stellung aendert sich, ohne dass jemand einen Knoten anfasst.
//
// Sprosse 4 zeichnete eine feste Stellung. Hier gibt es eine, die sich
// aendern darf — und genau dafuer ist `useState` da: Es gibt der Beschreibung
// eine Quelle, die zwischen zwei Durchlaeufen ueberlebt. Die Knoten sind
// danach Folge, nie Speicher.
import { describe, it, expect } from 'vitest';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { brettLesen, START } from './brett';

const NACH_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

function Partie() {
  const [fen, setFen] = useState(START);
  const brett = brettLesen(fen);
  return (
    <div>
      <button onClick={() => setFen(NACH_E4)}>e4</button>
      <div data-brett="">
        {brett.flatMap((reihe, r) =>
          reihe.map((feld, f) => <div key={`${r}-${f}`}>{feld ?? ''}</div>)
        )}
      </div>
    </div>
  );
}

describe('Sprosse 5 — eine Quelle, die ueberlebt', () => {
  it('ein Zug aendert die Anzeige, ohne dass ein Knoten angefasst wird', () => {
    const behaelter = document.createElement('div');
    document.body.appendChild(behaelter);
    act(() => {
      createRoot(behaelter).render(<Partie />);
    });

    const flaeche = behaelter.querySelector('[data-brett]') as HTMLElement;
    expect(flaeche.children[52].textContent).toBe('P'); // e2 besetzt
    expect(flaeche.children[36].textContent).toBe(''); // e4 leer

    act(() => {
      behaelter.querySelector('button')!.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      );
    });

    // Beide Felder stimmen — und zwar, weil die Beschreibung neu abgeleitet
    // wurde. Vergessen kann man hier nichts, es gibt nichts zu tun.
    const danach = behaelter.querySelector('[data-brett]') as HTMLElement;
    expect(danach.children[52].textContent).toBe('');
    expect(danach.children[36].textContent).toBe('P');
  });
});

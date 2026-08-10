// Sprosse 3 — Neu: Aus dem Brett entstehen Knoten im Dokument, von Hand.
//
// Kein React. `document` ist hier kein Browser, sondern jsdom — eine
// Nachbildung derselben Schnittstelle in Node. Was danach kommt, sieht
// deshalb aus wie Browserarbeit und ist keine; genau diese Grenze ist der
// Grund, warum in der Lektion eine vierte Testebene fehlt.
import { describe, it, expect } from 'vitest';
import { brettLesen, START, type Brett } from './brett';

function brettZeichnen(brett: Brett): HTMLElement {
  const wurzel = document.createElement('div');
  for (const reihe of brett) {
    for (const feld of reihe) {
      const knoten = document.createElement('div');
      knoten.dataset.feld = feld ?? '';
      knoten.textContent = feld ?? '';
      wurzel.appendChild(knoten);
    }
  }
  return wurzel;
}

describe('Sprosse 3 — Knoten von Hand', () => {
  it('vierundsechzig Felder werden vierundsechzig Knoten', () => {
    expect(brettZeichnen(brettLesen(START)).children).toHaveLength(64);
  });

  it('der Knoten an Stelle 4 traegt den schwarzen Koenig', () => {
    expect(brettZeichnen(brettLesen(START)).children[4].textContent).toBe('k');
  });

  it('ein Zug ist hier zweierlei Arbeit — und die Haelfte davon kann man vergessen', () => {
    const wurzel = brettZeichnen(brettLesen(START));
    const von = wurzel.children[52] as HTMLElement; // e2
    const nach = wurzel.children[36] as HTMLElement; // e4

    // Nur die eine Haelfte ausgefuehrt: die Figur ist angekommen …
    nach.textContent = von.textContent;
    expect(nach.textContent).toBe('P');
    // … und steht gleichzeitig noch dort, wo sie herkam.
    expect(von.textContent).toBe('P');

    // Der Baum zeigt jetzt eine Stellung, die nie gespielt wurde. Nichts
    // hat es gemeldet — es gibt niemanden, der es melden koennte.
  });
});

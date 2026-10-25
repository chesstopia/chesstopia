import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { figurVon, zeichne } from '../../modell/brettbild';
import { leereStellung, type Farbe, type Feld, type Figur, type Stellung, type Zug } from '../../modell/schach';
import { ziehePerZeiger } from '../intern/geste';
import { warteAufWert } from '../intern/warten';

/** Das Schachbrett: 64 Felder mit `data-square`, Figuren als `data-piece` (z. B. `wK`). */
export class Brett {
  constructor(
    private readonly page: Page,
    private readonly farbe: Farbe,
  ) {}

  async warteBisGerendert(): Promise<void> {
    await expect(this.page.locator('[data-square]'), `${this.farbe}: Brett nicht gerendert`).toHaveCount(64);
  }

  /** Nur die Geste — was danach geschieht, entscheidet der Aufrufer. */
  async ziehe(zug: Zug): Promise<void> {
    await ziehePerZeiger(this.page, zug.von, zug.nach);
  }

  /** Momentaufnahme in einem Zug durch die Seite, damit sie nicht zwischen zwei Feldern kippt. */
  async stellung(): Promise<Stellung> {
    const felder = await this.page.locator('[data-square]').evaluateAll((elemente) =>
      elemente.map((element) => ({
        feld: element.getAttribute('data-square'),
        figur: element.querySelector('[data-piece]')?.getAttribute('data-piece') ?? null,
      })),
    );
    const stellung = leereStellung();
    for (const { feld, figur } of felder) {
      if (figur === null) continue;
      // wK → K (Weiß), bK → k (Schwarz): dieselben Buchstaben wie im Brettbild.
      const symbol = figur[0] === 'w' ? figur[1] : figur[1].toLowerCase();
      const gefunden = figurVon(symbol);
      if (gefunden === null) throw new Error(`${this.farbe}: unbekannte Figur im DOM: ${figur}`);
      stellung[feld as Feld] = gefunden;
    }
    return stellung;
  }

  async erwarteStellung(soll: Stellung): Promise<void> {
    await warteAufWert(
      `${this.farbe}: Stellung weicht ab (Brettbild: sichtbar gegen erwartet)`,
      async () => zeichne(await this.stellung()),
      zeichne(soll),
    );
  }

  async erwarteFigur(feld: Feld, figur: Figur | null): Promise<void> {
    const text = (f: Figur | null) => (f === null ? 'leer' : `${f.farbe} ${f.art}`);
    await warteAufWert(
      `${this.farbe}: Feld ${feld} erwartet ${text(figur)}`,
      async () => text((await this.stellung())[feld]),
      text(figur),
    );
  }
}

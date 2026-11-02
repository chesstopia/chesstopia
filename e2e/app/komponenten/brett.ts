import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { figurVon, zeichne } from '../../modell/brettbild';
import { leereStellung, type Ausrichtung, type Farbe, type Feld, type Figur, type Stellung, type Umwandlung, type Zug } from '../../modell/schach';
import { ziehePerZeiger } from '../intern/geste';
import { warteAufWert } from '../intern/warten';

/** Werte von `data-promotion-choice` — die Figurnamen des API-Kontrakts. */
const WAHL: Record<Umwandlung, string> = { dame: 'QUEEN', turm: 'ROOK', laeufer: 'BISHOP', springer: 'KNIGHT' };

/** Das Schachbrett: 64 Felder mit `data-square`, Figuren als `data-piece` (z. B. `wK`). */
export class Brett {
  constructor(
    private readonly page: Page,
    private readonly farbe: Farbe,
  ) {}

  async warteBisGerendert(): Promise<void> {
    await expect(this.page.locator('[data-square]'), `${this.farbe}: Brett nicht gerendert`).toHaveCount(64);
  }

  /**
   * Die Geste, bei einem Umwandlungszug zusätzlich Wahl und Bestätigung. Ob der
   * Zug danach angenommen wird, entscheidet der Aufrufer. Trägt der Zug ein
   * Suffix, muss die Auswahl aufklappen — sonst ist der Testfall falsch.
   */
  async ziehe(zug: Zug): Promise<void> {
    await ziehePerZeiger(this.page, zug.von, zug.nach);
    if (zug.umwandlung === undefined) return;
    await expect(
      this.auswahl(),
      `${this.farbe}: Zug ${zug.von}-${zug.nach} (${zug.umwandlung}): Umwandlungsauswahl erwartet, aber nicht geöffnet`,
    ).toBeVisible();
    await this.waehleUmwandlung(zug.umwandlung);
  }

  /** Nur die Geste, ohne Auswahl — für Züge, die abgelehnt werden sollen. */
  async versucheZug(zug: Zug): Promise<void> {
    await ziehePerZeiger(this.page, zug.von, zug.nach);
  }

  async umwandlungsauswahlOffen(): Promise<boolean> {
    return this.auswahl().isVisible();
  }

  async erwarteUmwandlungsauswahl(offen: boolean): Promise<void> {
    const meldung = `${this.farbe}: Umwandlungsauswahl ${offen ? 'erwartet' : 'unerwartet offen'}`;
    if (offen) await expect(this.auswahl(), meldung).toBeVisible();
    else await expect(this.auswahl(), meldung).toBeHidden();
  }

  /** Figur anwählen, dann mit ✓ bestätigen. */
  async waehleUmwandlung(umwandlung: Umwandlung): Promise<void> {
    await this.page.locator(`[data-promotion-choice="${WAHL[umwandlung]}"]`).click();
    await this.page.locator('[data-promotion-confirm]').click();
  }

  private auswahl() {
    return this.page.locator('[data-promotion-picker]');
  }

  /** Vergleicht die Bildschirmlage von a1 und a8; die DOM-Reihenfolge zählt nicht. */
  async ausrichtung(): Promise<Ausrichtung> {
    const a1 = await this.page.locator('[data-square="a1"]').boundingBox();
    const a8 = await this.page.locator('[data-square="a8"]').boundingBox();
    if (a1 === null || a8 === null) throw new Error(`${this.farbe}: a1 oder a8 nicht sichtbar`);
    return a1.y > a8.y ? 'weiss-unten' : 'schwarz-unten';
  }

  /** Momentaufnahme in einem Zug durch die Seite, damit sie nicht zwischen zwei Feldern kippt. */
  async stellung(): Promise<Stellung> {
    const felder = await this.page.locator('[data-square]').evaluateAll((elemente) =>
      elemente.map((element) => ({
        feld: element.getAttribute('data-square'),
        figur: element.querySelector('[data-piece]')?.getAttribute('data-piece') ?? null,
      })),
    );
    // Ohne Brett wäre die Stellung leer und `erwarteFigur(x, null)` trivial grün;
    // `warteAufWert` wiederholt bei Wurf.
    if (felder.length !== 64) throw new Error(`${this.farbe}: Brett nicht gerendert (${felder.length} Felder)`);
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

  /** Das Feld mit Schach-Rahmen (`data-check`, Wert `check` oder `mate`); `null`, wenn keines markiert ist. */
  async schachfeld(): Promise<Feld | null> {
    const felder = await this.page.locator('[data-check]').evaluateAll((elemente) =>
      elemente.map((element) => element.getAttribute('data-square')),
    );
    if (felder.length > 1) throw new Error(`${this.farbe}: mehrere Schachfelder markiert: ${felder.join(', ')}`);
    return (felder[0] as Feld | undefined) ?? null;
  }

  async erwarteSchach(feld: Feld | null): Promise<void> {
    await warteAufWert(
      `${this.farbe}: Schach-Rahmen erwartet ${feld ?? 'auf keinem Feld'}`,
      () => this.schachfeld(),
      feld,
    );
  }
}

import type { Browser, Page } from '@playwright/test';
import type { Farbe, Feld, Figur, Partie, Stellung, Zug, Zuganzeige } from '../modell/schach';
import { schneideAngelegtePartienMit } from './intern/aufraeumen';
import { stompAbo } from './intern/live';
import { warteBis } from './intern/warten';
import { Netz } from './netz';
import { Partieseite } from './seiten/partieseite';
import { Startseite } from './seiten/startseite';

export interface Spieler {
  readonly farbe: Farbe;
  readonly startseite: Startseite;
  readonly partieseite: Partieseite;
  readonly netz: Netz;

  // Handlungen
  starteNeuePartie(): Promise<Partie>;
  trittBei(einladungslink: string): Promise<void>;
  ziehe(zug: Zug): Promise<void>;
  versucheZug(zug: Zug): Promise<void>;
  ladeNeu(): Promise<void>;
  loeschePartie(id: string): Promise<void>;

  // Abfragen — Momentaufnahme, ohne Warten
  stellung(): Promise<Stellung>;
  zuganzeige(): Promise<Zuganzeige>;

  // Erwartungen — wiederholen bis Timeout
  erwarteStellung(soll: Stellung): Promise<void>;
  erwarteFigur(feld: Feld, figur: Figur | null): Promise<void>;
  erwarteZuganzeige(soll: Zuganzeige): Promise<void>;
  erwarteErgebnis(text: string | null): Promise<void>;
  erwarteSchach(feld: Feld | null): Promise<void>;
  erwarteFehler(text: string | RegExp | null): Promise<void>;
  erwartePartieGeloescht(): Promise<void>;
}

/**
 * Eigener Browser-Kontext je Spieler: Pflicht, weil die Rolle im
 * `localStorage` (`chesstopia.games`) steht und `useGameState` einen dort
 * vorhandenen Eintrag vor dem Token aus der URL nimmt. Der Kontext bekommt
 * die baseURL ausdrücklich, `browser.newContext()` übernimmt sie nicht aus der
 * Konfiguration. `Browser` erscheint nur hier und wird nur aus testlauf.ts
 * gerufen.
 */
export async function erzeugeSpieler(
  browser: Browser,
  farbe: Farbe,
  baseURL: string | undefined,
): Promise<{ spieler: Spieler; schliessen: () => Promise<void> }> {
  const kontext = await browser.newContext({ baseURL });
  let page: Page;
  try {
    page = await kontext.newPage();
  } catch (fehler) {
    await kontext.close();
    throw fehler;
  }
  const startseite = new Startseite(page, farbe);
  const partieseite = new Partieseite(page, farbe);
  const netz = new Netz(page);
  const angelegtePartien = schneideAngelegtePartienMit(page);

  /** Brett steht und das STOMP-Abo ist gesendet; der Listener hängt vor `oeffnen`. */
  const oeffneUndWarte = async (oeffnen: () => Promise<void>): Promise<void> => {
    const abo = stompAbo(page, farbe);
    await oeffnen();
    await partieseite.brett.warteBisGerendert();
    await abo;
  };

  const spieler: Spieler = {
    farbe,
    startseite,
    partieseite,
    netz,

    async starteNeuePartie() {
      await startseite.oeffne();
      await oeffneUndWarte(() => startseite.neuePartieStarten());
      return {
        id: partieseite.partieId(),
        einladungslink: await partieseite.einladung.einladungslink(),
      };
    },

    async trittBei(einladungslink) {
      await oeffneUndWarte(() => partieseite.oeffne(einladungslink));
    },

    /**
     * Zieht und wartet, bis der Zug angenommen oder abgelehnt ist. Wer
     * absichtlich außer der Reihe oder illegal zieht, nimmt `versucheZug`.
     *
     * Ein Fehler, der schon vor der Geste sichtbar war (er bleibt stehen, bis
     * der nächste Versuch gelingt), gilt nicht als Ablehnung dieses Zugs: Nur
     * ein anderer Text zählt. Grenze: Lehnt die Anwendung zweimal mit
     * demselben Text ab, bleibt die zweite Ablehnung unsichtbar, und `ziehe`
     * scheitert erst am Timeout.
     */
    async ziehe(z) {
      try {
        await partieseite.zugzeile.erwarteAnzeige('du-bist-am-zug');
      } catch (fehler) {
        throw new Error(`${farbe}: Zug ${z.von}-${z.nach}: kein Zugrecht: ${(fehler as Error).message}`);
      }
      const vorher = await partieseite.fehleranzeige.text();
      await partieseite.brett.ziehe(z);
      const { fehler } = await warteBis(
        `${farbe}: Zug ${z.von}-${z.nach} weder angenommen noch abgelehnt`,
        async () => ({
          anzeige: await partieseite.zugzeile.anzeige(),
          fehler: await partieseite.fehleranzeige.text(),
        }),
        ({ anzeige, fehler }) =>
          (fehler !== null && fehler !== vorher) ||
          anzeige === 'gegner-ist-am-zug' ||
          anzeige === 'keine',
      );
      if (fehler !== null && fehler !== vorher) {
        throw new Error(`${farbe}: Zug ${z.von}-${z.nach} abgelehnt: ${fehler}`);
      }
    },

    async versucheZug(z) {
      await partieseite.brett.ziehe(z);
    },

    async ladeNeu() {
      await oeffneUndWarte(() => page.reload().then(() => undefined));
    },

    async loeschePartie(id) {
      await startseite.oeffne();
      await startseite.klickeLoeschen(id);
      await startseite.loeschdialog.bestaetigen();
      await startseite.erwartePartieGelistet(id, false);
    },

    stellung: () => partieseite.brett.stellung(),
    zuganzeige: () => partieseite.zugzeile.anzeige(),

    erwarteStellung: (soll) => partieseite.brett.erwarteStellung(soll),
    erwarteFigur: (feld, figur) => partieseite.brett.erwarteFigur(feld, figur),
    erwarteZuganzeige: (soll) => partieseite.zugzeile.erwarteAnzeige(soll),
    erwarteErgebnis: (text) => partieseite.ergebnis.erwarteText(text),
    erwarteSchach: (feld) => partieseite.brett.erwarteSchach(feld),
    erwarteFehler: (text) => partieseite.fehleranzeige.erwarte(text),
    erwartePartieGeloescht: () => partieseite.loeschhinweis.erwarteSichtbar(),
  };

  // Erst die angelegten Partien löschen, dann den Kontext schließen — auch
  // wenn das Löschen scheitert; dessen Fehler wird danach geworfen.
  const schliessen = async (): Promise<void> => {
    let loeschfehler: unknown;
    try {
      if (baseURL === undefined) {
        throw new Error(`${farbe}: Aufräumen: baseURL fehlt, angelegte Partien können nicht gelöscht werden`);
      }
      await angelegtePartien.loescheAlle(kontext.request, baseURL);
    } catch (fehler) {
      loeschfehler = fehler;
    }
    await kontext.close();
    if (loeschfehler !== undefined) throw loeschfehler;
  };

  return { spieler, schliessen };
}

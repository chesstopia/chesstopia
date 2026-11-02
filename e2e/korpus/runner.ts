import type { Farbe } from '../modell/schach';
import type { Spieler } from '../app/spieler';
import type { Werkzeuge } from '../testlauf';
import type { CorpusCase } from './parser';

const FARBE = { white: 'weiss', black: 'schwarz' } as const;

/**
 * Spielt einen Korpusfall von der Startstellung durch und prüft ihn.
 *
 * Seit CHESS-19 spielt jede Seite in ihrem eigenen Browser-Kontext: Weiß legt
 * die Partie an, Schwarz kommt über den Einladungslink. Halbzug `i` gehört
 * Weiß bei geradem, Schwarz bei ungeradem Index — jeder Fall beginnt in der
 * Startstellung. Daraus folgt dieselbe Einschränkung wie zuvor: Abgelehnt
 * werden darf nur der letzte Halbzug, denn ein abgelehnter Zug gibt das
 * Zugrecht nicht weiter.
 *
 * `ziehe` wartet vor jedem Zug auf das eigene Zugrecht und danach auf die
 * Annahme. Damit belegt schon der nächste Zug, dass die Stellung über den
 * WS-Push angekommen und die Seite nicht mehr gesperrt ist. Nach dem letzten
 * Halbzug wartet nichts: dort warten die Erwartungen selbst.
 */
export async function runCase(
  neuerSpieler: Werkzeuge['neuerSpieler'],
  testCase: CorpusCase,
): Promise<void> {
  // ARRANGE
  const weiss = await neuerSpieler('weiss');
  const schwarz = await neuerSpieler('schwarz');
  const partie = await weiss.starteNeuePartie();
  await schwarz.trittBei(partie.einladungslink);
  const spieler: Record<Farbe, Spieler> = { weiss, schwarz };
  const spielerVon = (index: number): Spieler => (index % 2 === 0 ? weiss : schwarz);
  const letzter = testCase.moves.length - 1;

  // ACT
  for (const [index, zug] of testCase.moves.entries()) {
    if (index === letzter && testCase.error !== null) {
      // Der abgelehnte Zug: `ziehe` würde die Annahme erwarten und werfen. Das
      // Zugrecht muss vorher da sein, sonst sperrt die Seite die Geste selbst.
      await spielerVon(index).erwarteZuganzeige('du-bist-am-zug');
      await spielerVon(index).versucheZug(zug);
    } else {
      await spielerVon(index).ziehe(zug);
    }
  }

  // ASSERTIONS — beide Seiten zeigen dieselbe Partie
  for (const s of [weiss, schwarz]) {
    await s.erwarteStellung(testCase.board);
  }

  for (const farbe of ['weiss', 'schwarz'] as const) {
    if (testCase.turn !== null) {
      const amZug = FARBE[testCase.turn];
      await spieler[farbe].erwarteZuganzeige(
        farbe === amZug ? 'du-bist-am-zug' : 'gegner-ist-am-zug',
      );
    } else {
      await spieler[farbe].erwarteErgebnis(testCase.banner);
      await spieler[farbe].erwarteZuganzeige('keine');
    }
  }

  // Der Schach-Rahmen erscheint bei beiden Seiten; ohne `check` darf keiner da sein.
  for (const s of [weiss, schwarz]) {
    await s.erwarteSchach(testCase.check);
  }

  // Die Fehlermeldung erscheint nur bei der Seite, die den Zug versucht hat.
  const letzterZiehender = spielerVon(letzter);
  for (const s of [weiss, schwarz]) {
    await s.erwarteFehler(s === letzterZiehender ? testCase.error : null);
  }

  // Die Sperrgeste macht die Seite, die ohne Partieende jetzt am Zug wäre.
  // Bei der anderen Seite wäre die Prüfung wertlos: Die ist schon durch das
  // fehlende Zugrecht gesperrt und bliebe es auch ohne Partieende.
  if (testCase.locked !== null) {
    const naechster = spielerVon(testCase.moves.length);
    await naechster.versucheZug(testCase.locked);
    await naechster.erwarteStellung(testCase.board);
    await naechster.erwarteFehler(null);
  }
}

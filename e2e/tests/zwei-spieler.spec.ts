import { brettbild } from '../modell/brettbild';
import { zug } from '../modell/schach';
import { gruppe, szenario } from '../testlauf';

/**
 * Zwei Browser, eine Partie: Weiß legt sie an, Schwarz tritt über den
 * Einladungslink bei. Die Specs davor kennen nur einen Spieler; hier zeigt
 * sich, ob der Push über /ws in beide Richtungen ankommt.
 */
gruppe('Zwei Spieler', () => {
  szenario('zwei Spieler spielen über die Direkteinladung gegeneinander', async ({
    neuerSpieler,
  }) => {
    // ARRANGE
    const weiss = await neuerSpieler('weiss');
    const schwarz = await neuerSpieler('schwarz');
    const partie = await weiss.starteNeuePartie();
    await schwarz.trittBei(partie.einladungslink);

    // ACT — Jeder `ziehe` wartet zuerst auf das eigene Zugrecht. Kommt der
    // Push nicht an, scheitert der nächste Zug oder die Schlussprüfung.
    // Deshalb gibt es keine Zwischenprüfungen.
    await weiss.ziehe(zug('e2e4'));
    await schwarz.ziehe(zug('e7e5'));
    await weiss.ziehe(zug('g1f3'));
    await schwarz.ziehe(zug('b8c6'));

    // ASSERTIONS — beide Seiten zeigen dieselbe Stellung
    const erwartet = brettbild(`
      8  r . b q k b n r
      7  p p p p . p p p
      6  . . n . . . . .
      5  . . . . p . . .
      4  . . . . P . . .
      3  . . . . . N . .
      2  P P P P . P P P
      1  R N B Q K B . R
    `);
    await weiss.erwarteStellung(erwartet);
    await schwarz.erwarteStellung(erwartet);
    await weiss.erwarteZuganzeige('du-bist-am-zug');
    await schwarz.erwarteZuganzeige('gegner-ist-am-zug');
  });
});

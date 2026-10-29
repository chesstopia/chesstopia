import { zug } from '../modell/schach';
import { expect, gruppe, szenario } from '../testlauf';

gruppe('Startseite', () => {
  szenario('beide Spieler sehen die Partie mit Farbe und Zugrecht', async ({ neuerSpieler }) => {
    // ARRANGE
    const weiss = await neuerSpieler('weiss');
    const schwarz = await neuerSpieler('schwarz');
    const partie = await weiss.starteNeuePartie();
    await schwarz.trittBei(partie.einladungslink);
    await weiss.ziehe(zug('e2e4'));

    // ACT
    await weiss.startseite.oeffne();
    await schwarz.startseite.oeffne();

    // ASSERTIONS
    await weiss.startseite.partieliste.erwarteEintrag(partie.id, {
      abschnitt: 'laufend',
      farbe: 'weiss',
      eingeladen: false,
      status: 'Gegner am Zug',
    });
    await schwarz.startseite.partieliste.erwarteEintrag(partie.id, {
      abschnitt: 'laufend',
      farbe: 'schwarz',
      eingeladen: true,
      status: 'Du bist am Zug',
    });
    for (const spieler of [weiss, schwarz]) {
      const eintrag = await spieler.startseite.partieliste.eintrag(partie.id);
      expect(eintrag?.zuletzt, `${spieler.farbe}: zuletzt gespielt`).toBeTruthy();
      expect(eintrag?.zuletzt).not.toContain('Invalid');
    }
  });

  szenario('nach Matt steht die Partie bei beiden unter Beendet', async ({ neuerSpieler }) => {
    // ARRANGE
    const weiss = await neuerSpieler('weiss');
    const schwarz = await neuerSpieler('schwarz');
    const partie = await weiss.starteNeuePartie();
    await schwarz.trittBei(partie.einladungslink);

    // ACT — Narrenmatt
    await weiss.ziehe(zug('f2f3'));
    await schwarz.ziehe(zug('e7e5'));
    await weiss.ziehe(zug('g2g4'));
    await schwarz.ziehe(zug('d8h4'));
    await weiss.startseite.oeffne();
    await schwarz.startseite.oeffne();

    // ASSERTIONS
    await weiss.startseite.partieliste.erwarteEintrag(partie.id, {
      abschnitt: 'beendet',
      status: 'Verloren · Schachmatt',
    });
    await schwarz.startseite.partieliste.erwarteEintrag(partie.id, {
      abschnitt: 'beendet',
      status: 'Gewonnen · Schachmatt',
    });
  });
});

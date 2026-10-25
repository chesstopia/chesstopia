import { gruppe, szenario } from '../testlauf';

/**
 * Der Ersteller löscht seine Partie auf der Startseite. Abbrechen lässt sie
 * stehen; Bestätigen entfernt sie, und der Gegner sieht auf der Partieseite
 * per Push den Hinweis.
 */
gruppe('Löschen', () => {
  szenario('Weiß löscht die Partie auf der Startseite, Schwarz sieht den Hinweis', async ({
    neuerSpieler,
  }) => {
    // ARRANGE
    const weiss = await neuerSpieler('weiss');
    const schwarz = await neuerSpieler('schwarz');
    const partie = await weiss.starteNeuePartie();
    await schwarz.trittBei(partie.einladungslink);
    await weiss.startseite.oeffne();

    // ACT — Abbrechen
    await weiss.startseite.klickeLoeschen(partie.id);
    await weiss.startseite.loeschdialog.abbrechen();

    // ASSERTIONS — die Partie steht noch in der Liste
    await weiss.startseite.erwartePartieGelistet(partie.id, true);

    // ACT — Bestätigen
    await weiss.loeschePartie(partie.id);

    // ASSERTIONS
    await weiss.startseite.erwartePartieGelistet(partie.id, false);
    await schwarz.erwartePartieGeloescht();
  });
});

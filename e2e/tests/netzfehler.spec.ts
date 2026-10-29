import { figur, zug } from '../modell/schach';
import { gruppe, szenario } from '../testlauf';

/**
 * Der Fehlerpfad, den nur die Oberfläche hat: Das Backend antwortet auf einen
 * Zug mit 5xx, `useGameState` fängt den Axios-Fehler und `GamePage.tsx`
 * rendert ihn als `Fehler:`-Absatz. Auf Ebene 3 ist dieser Ast unerreichbar — dort
 * gibt es keinen Axios-Client und keinen Absatz.
 *
 * Nur der Zug-Endpunkt wird abgefangen; das Anlegen der Partie muss gelingen,
 * sonst gibt es kein Brett, auf dem gezogen werden könnte.
 */
gruppe('Netzfehler', () => {
  szenario('ein Serverfehler beim Zug erscheint als Fehlermeldung und lässt das Brett stehen', async ({
    neuerSpieler,
  }) => {
    // ARRANGE
    const weiss = await neuerSpieler('weiss');
    await weiss.netz.serverfehlerBeimZug();
    await weiss.starteNeuePartie();
    await weiss.erwarteFigur('e2', figur('weiss', 'bauer'));

    // ACT
    await weiss.versucheZug(zug('e2', 'e4'));

    // ASSERTIONS
    await weiss.erwarteFehler(/.+/);
    await weiss.erwarteFigur('e2', figur('weiss', 'bauer'));
    await weiss.erwarteFigur('e4', null);
    await weiss.erwarteZuganzeige('du-bist-am-zug');
  });
});

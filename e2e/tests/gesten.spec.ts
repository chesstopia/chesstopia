import { figur, zug } from '../modell/schach';
import { expect, gruppe, szenario } from '../testlauf';

/**
 * Zeigergesten, die keine Schachsituation sind und deshalb nicht in den Korpus
 * gehören. Die Entsprechung auf Ebene 2 (`Chessboard.test.tsx`) fährt
 * synthetische Events in jsdom — dass die Verweigerung auch eine echte
 * Pointer-Geste im Browser überlebt, prüft ausschließlich dieser Test.
 */
gruppe('Gesten', () => {
  szenario('eine Figur der nicht ziehenden Seite lässt sich nicht aufnehmen', async ({
    neuerSpieler,
  }) => {
    // ARRANGE — der Spieler spielt Weiß und ist am Zug, e7 gehört Schwarz.
    const weiss = await neuerSpieler('weiss');
    await weiss.starteNeuePartie();
    await weiss.erwarteZuganzeige('du-bist-am-zug');

    // ACT
    await weiss.versucheZug(zug('e7e5'));

    // ASSERTIONS — Square.tsx verweigert das Aufnehmen bereits am
    // onPointerDown (draggable=false), der Zug erreicht das Backend nie.
    await weiss.erwarteFigur('e7', figur('schwarz', 'bauer'));
    await weiss.erwarteZuganzeige('du-bist-am-zug');
  });

  szenario('ziehe meldet einen abgelehnten Zug mit dessen Text', async ({ neuerSpieler }) => {
    // ARRANGE
    const weiss = await neuerSpieler('weiss');
    await weiss.starteNeuePartie();

    // ACT & ASSERTIONS
    await expect(weiss.ziehe(zug('e2', 'e5'))).rejects.toThrow(
      'weiss: Zug e2-e5 abgelehnt: Dieser Zug ist nicht legal.',
    );
  });
});

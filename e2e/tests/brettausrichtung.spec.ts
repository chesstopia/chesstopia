import { figur, zug } from '../modell/schach';
import { expect, gruppe, szenario } from '../testlauf';

gruppe('Brettausrichtung', () => {
  szenario('Schwarz sieht das Brett gedreht und kann darauf ziehen', async ({ neuerSpieler }) => {
    // ARRANGE
    const weiss = await neuerSpieler('weiss');
    const schwarz = await neuerSpieler('schwarz');
    const partie = await weiss.starteNeuePartie();
    await schwarz.trittBei(partie.einladungslink);

    // ACT
    await weiss.ziehe(zug('e2e4'));
    await schwarz.ziehe(zug('e7e5'));

    // ASSERTIONS
    expect(await weiss.partieseite.brett.ausrichtung()).toBe('weiss-unten');
    expect(await schwarz.partieseite.brett.ausrichtung()).toBe('schwarz-unten');
    await weiss.erwarteFigur('e5', figur('schwarz', 'bauer'));
  });
});

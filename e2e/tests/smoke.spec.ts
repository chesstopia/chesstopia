import { figur, zug } from '../modell/schach';
import { gruppe, szenario } from '../testlauf';

/**
 * Die Teilmenge aus ADR-0019, die nach jedem Deploy läuft: Anwendung lädt,
 * Brett rendert, Backend antwortet, Datenbank hält den Zustand. Unter einer
 * Minute, keine Abhängigkeit von den funktionalen Specs.
 */
gruppe('Smoke', () => {
  szenario('Anwendung lädt, Brett rendert, Backend antwortet, Datenbank hält den Zustand', async ({
    neuerSpieler,
  }) => {
    // ARRANGE
    const weiss = await neuerSpieler('weiss');

    // ACT — die Partie entsteht über die Startseite; starteNeuePartie
    // kehrt erst zurück, wenn das Brett mit 64 Feldern steht.
    await weiss.starteNeuePartie();

    // ASSERTIONS — Backend antwortet (Startstellung: weißer König auf e1)
    await weiss.erwarteFigur('e1', figur('weiss', 'koenig'));
    // Diese Prüfung steht bewusst NACH der obigen: unmittelbar nach dem Anlegen
    // wäre sie ein No-Op, weil ein Fehlerabsatz erst nach einer gescheiterten
    // Antwort erscheint.
    await weiss.erwarteFehler(null);

    // ACT — ein Zug, dann ein Reload
    await weiss.ziehe(zug('e2', 'e4'));
    await weiss.ladeNeu();

    // ASSERTIONS — nach dem Reload kam die Stellung aus der Datenbank
    await weiss.erwarteFigur('e4', figur('weiss', 'bauer'));
    await weiss.erwarteFigur('e2', null);
  });
});

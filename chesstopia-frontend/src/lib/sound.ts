/**
 * Spielt eine Tondatei ab und wirft nie. Ohne vorherige Nutzerinteraktion
 * lehnt der Browser `play()` ab (Autoplay-Policy) — das ist eine bekannte,
 * akzeptierte Lücke und kein Fehler für die Oberfläche.
 */
export function playSound(url: string): void {
  try {
    const result = new Audio(url).play();
    // Ältere Browser liefern kein Promise.
    result?.catch(() => {});
  } catch {
    // Ohne Audio-Unterstützung bleibt es still.
  }
}

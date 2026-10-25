import type { Page } from '@playwright/test';
import type { Feld } from '../../modell/schach';

/**
 * Bewegt eine Figur von einem Feld zum anderen per echter Pointer-Geste.
 *
 * `Chessboard.tsx` reagiert bewusst auf Pointer-Events statt der HTML5-
 * Drag-API (jsdom kann Letztere nicht durchspielen, ADR-0019 macht Ebene 2
 * für die Komponente zur Pflicht) — Playwrights `locator.dragTo()` setzt
 * aber genau diese API voraus und greift hier nicht. `steps: 5` sorgt für
 * Zwischenpositionen, damit das Zielfeld sein `pointerenter` bekommt, bevor
 * `pointerup` dort ankommt.
 */
export async function ziehePerZeiger(page: Page, von: Feld, nach: Feld): Promise<void> {
  const quelle = page.locator(`[data-square="${von}"]`);
  const ziel = page.locator(`[data-square="${nach}"]`);
  const quellBox = await quelle.boundingBox();
  const zielBox = await ziel.boundingBox();
  if (!quellBox || !zielBox) {
    throw new Error(`Feld nicht gefunden: ${von} → ${nach}`);
  }

  await page.mouse.move(quellBox.x + quellBox.width / 2, quellBox.y + quellBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(zielBox.x + zielBox.width / 2, zielBox.y + zielBox.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
}

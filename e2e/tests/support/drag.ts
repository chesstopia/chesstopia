import type { Page } from '@playwright/test';

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
export async function dragPiece(page: Page, from: string, to: string): Promise<void> {
  const source = page.locator(`[data-square="${from}"]`);
  const target = page.locator(`[data-square="${to}"]`);
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error(`Feld nicht gefunden: ${from} → ${to}`);
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
}

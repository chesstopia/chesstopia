import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromotionPicker } from '../PromotionPicker';
import type { Promotion } from '@/lib/moveRequest';

function renderPicker(selected: Promotion = 'QUEEN') {
  const props = { onSelect: vi.fn(), onConfirm: vi.fn(), onCancel: vi.fn() };
  render(<PromotionPicker side="w" selected={selected} {...props} />);
  return props;
}

describe('PromotionPicker', () => {
  it('rendert vier Figuren, ✓ und ✗ in Spaltenreihenfolge', () => {
    // ACT
    renderPicker();

    // ASSERTIONS
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Dame', 'Turm', 'Läufer', 'Springer', 'Umwandlung bestätigen', 'Umwandlung abbrechen',
    ]);
  });

  it('markiert die angewählte Figur', () => {
    // ACT
    renderPicker('BISHOP');

    // ASSERTIONS
    expect(screen.getByRole('button', { name: 'Läufer' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Dame' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('fokussiert beim Öffnen die angewählte Figur', () => {
    // ACT
    renderPicker();

    // ASSERTIONS
    expect(screen.getByRole('button', { name: 'Dame' })).toHaveFocus();
  });

  it('meldet einen Klick auf den Turm als Auswahl', async () => {
    // ARRANGE
    const { onSelect } = renderPicker();

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Turm' }));

    // ASSERTIONS
    expect(onSelect).toHaveBeenCalledWith('ROOK');
  });

  it('meldet ✓ als Bestätigung', async () => {
    // ARRANGE
    const { onConfirm, onCancel } = renderPicker();

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Umwandlung bestätigen' }));

    // ASSERTIONS
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('meldet ✗ als Abbruch', async () => {
    // ARRANGE
    const { onConfirm, onCancel } = renderPicker();

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Umwandlung abbrechen' }));

    // ASSERTIONS
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('wählt mit Pfeil runter die nächste Figur', async () => {
    // ARRANGE
    const { onSelect } = renderPicker('ROOK');

    // ACT
    await userEvent.keyboard('{ArrowDown}');

    // ASSERTIONS
    expect(onSelect).toHaveBeenCalledWith('BISHOP');
  });

  it('wählt mit Pfeil hoch die vorige Figur', async () => {
    // ARRANGE
    const { onSelect } = renderPicker('ROOK');

    // ACT
    await userEvent.keyboard('{ArrowUp}');

    // ASSERTIONS
    expect(onSelect).toHaveBeenCalledWith('QUEEN');
  });

  it('läuft mit den Pfeilen nicht über das Ende hinaus', async () => {
    // ARRANGE
    const { onSelect } = renderPicker('KNIGHT');

    // ACT
    await userEvent.keyboard('{ArrowDown}');

    // ASSERTIONS
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('bestätigt mit Enter', async () => {
    // ARRANGE
    const { onConfirm } = renderPicker();

    // ACT
    await userEvent.keyboard('{Enter}');

    // ASSERTIONS
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('bricht mit Esc ab', async () => {
    // ARRANGE
    const { onCancel } = renderPicker();

    // ACT
    await userEvent.keyboard('{Escape}');

    // ASSERTIONS
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

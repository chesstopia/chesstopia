import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '../ConfirmDialog';

function renderDialog(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const props = {
    open: true,
    title: 'Partie löschen?',
    description: 'Partie wirklich löschen? Das lässt sich nicht rückgängig machen.',
    confirmLabel: 'Löschen',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<ConfirmDialog {...props} />);
  return props;
}

describe('ConfirmDialog', () => {
  it('zeigt Titel, Text und beide Knöpfe', () => {
    // ARRANGE & ACT
    renderDialog();

    // ASSERTIONS
    const dialog = screen.getByRole('alertdialog', { name: 'Partie löschen?' });
    expect(dialog).toHaveTextContent('Partie wirklich löschen? Das lässt sich nicht rückgängig machen.');
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('ruft onConfirm beim Bestätigen', async () => {
    // ARRANGE
    const { onConfirm, onCancel } = renderDialog();

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));

    // ASSERTIONS
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('ruft onCancel bei Abbrechen', async () => {
    // ARRANGE
    const { onConfirm, onCancel } = renderDialog();

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    // ASSERTIONS
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('ruft onCancel bei Escape', async () => {
    // ARRANGE
    const { onConfirm, onCancel } = renderDialog();

    // ACT
    await userEvent.keyboard('{Escape}');

    // ASSERTIONS
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('ist geschlossen, wenn open=false', () => {
    // ARRANGE & ACT
    renderDialog({ open: false });

    // ASSERTIONS
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

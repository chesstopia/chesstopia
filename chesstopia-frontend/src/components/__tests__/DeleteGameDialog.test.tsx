import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteGameDialog } from '../DeleteGameDialog';

describe('DeleteGameDialog', () => {
  it('zeigt Titel und Warntext', () => {
    // ARRANGE & ACT
    render(<DeleteGameDialog open onConfirm={vi.fn()} onCancel={vi.fn()} />);

    // ASSERTIONS
    const dialog = screen.getByRole('dialog', { name: 'Partie löschen?' });
    expect(dialog).toHaveTextContent('Partie wirklich löschen? Das lässt sich nicht rückgängig machen.');
  });

  it('ruft onConfirm beim Klick auf Löschen', async () => {
    // ARRANGE
    const onConfirm = vi.fn();
    render(<DeleteGameDialog open onConfirm={onConfirm} onCancel={vi.fn()} />);

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));

    // ASSERTIONS
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('ruft onCancel beim Klick auf Abbrechen', async () => {
    // ARRANGE
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<DeleteGameDialog open onConfirm={onConfirm} onCancel={onCancel} />);

    // ACT
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    // ASSERTIONS
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('ruft onCancel bei Escape (cancel-Event)', () => {
    // ARRANGE
    const onCancel = vi.fn();
    render(<DeleteGameDialog open onConfirm={vi.fn()} onCancel={onCancel} />);

    // ACT
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));

    // ASSERTIONS
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('zeigt geschlossen keinen Dialog', () => {
    // ARRANGE & ACT
    render(<DeleteGameDialog open={false} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    // ASSERTIONS
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

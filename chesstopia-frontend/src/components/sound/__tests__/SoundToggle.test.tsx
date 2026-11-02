import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SoundToggle } from '../SoundToggle';

describe('SoundToggle', () => {
  beforeEach(() => localStorage.clear());

  it('schaltet den Ton aus und wieder ein', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(<SoundToggle />);

    // ACT
    await user.click(screen.getByRole('button', { name: 'Ton ausschalten' }));

    // ASSERTIONS
    const button = screen.getByRole('button', { name: 'Ton einschalten' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('chesstopia.soundMuted')).toBe('true');

    // ACT
    await user.click(button);

    // ASSERTIONS
    expect(screen.getByRole('button', { name: 'Ton ausschalten' })).toHaveAttribute('aria-pressed', 'false');
  });
});

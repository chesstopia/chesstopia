import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Toaster } from '@/components/ui/sonner';
import { InviteButtons } from '../InviteButtons';

const inviteLink = 'http://localhost/games/1?invite=abc';
const spectatorLink = 'http://localhost/games/1?spectate=xyz';

function renderButtons() {
  render(
    <>
      <InviteButtons inviteLink={inviteLink} spectatorLink={spectatorLink} />
      <Toaster />
    </>,
  );
}

describe('InviteButtons', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('trägt die Links in data-link', () => {
    // ARRANGE & ACT
    renderButtons();

    // ASSERTIONS
    expect(screen.getByRole('button', { name: 'Einladungslink kopieren' })).toHaveAttribute('data-link', inviteLink);
    expect(screen.getByRole('button', { name: 'Zuschauerlink kopieren' })).toHaveAttribute('data-link', spectatorLink);
  });

  it('schreibt den Link in die Zwischenablage und zeigt einen Toast', async () => {
    // ARRANGE
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    renderButtons();

    // ACT
    fireEvent.click(screen.getByRole('button', { name: 'Zuschauerlink kopieren' }));

    // ASSERTIONS
    expect(writeText).toHaveBeenCalledWith(spectatorLink);
    expect(await screen.findByText('Link kopiert')).toBeInTheDocument();
  });

  it('zeigt den Link im Klartext, wenn die Zwischenablage scheitert', async () => {
    // ARRANGE
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    renderButtons();

    // ACT
    fireEvent.click(screen.getByRole('button', { name: 'Einladungslink kopieren' }));

    // ASSERTIONS
    expect(await screen.findByText(inviteLink, { exact: false })).toBeInTheDocument();
  });

  it('zeigt den Link im Klartext, wenn es keine Zwischenablage gibt', async () => {
    // ARRANGE
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined });
    renderButtons();

    // ACT
    fireEvent.click(screen.getByRole('button', { name: 'Einladungslink kopieren' }));

    // ASSERTIONS
    expect(await screen.findByText(inviteLink, { exact: false })).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { StartPage } from '../StartPage';
import { GamePage } from '../GamePage';

const routes = [
  { path: '/', element: <StartPage /> },
  { path: '/game/:gameId', element: <GamePage /> },
];

describe('routing', () => {
  it('rendert die StartPage unter /', () => {
    // ARRANGE
    const router = createMemoryRouter(routes, { initialEntries: ['/'] });

    // ACT
    render(<RouterProvider router={router} />);

    // ASSERTIONS
    expect(screen.getByText('StartPage')).toBeInTheDocument();
  });

  it('rendert die GamePage mit gameId unter /game/:gameId', () => {
    // ARRANGE
    const router = createMemoryRouter(routes, { initialEntries: ['/game/abc-123'] });

    // ACT
    render(<RouterProvider router={router} />);

    // ASSERTIONS
    expect(screen.getByText('GamePage abc-123')).toBeInTheDocument();
  });
});

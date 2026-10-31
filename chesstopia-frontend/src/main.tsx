import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './index.css';
import { StartPage } from './pages/StartPage';
import { GamePage } from './pages/GamePage';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const router = createBrowserRouter([
  { path: '/', element: <StartPage /> },
  { path: '/game/:gameId', element: <GamePage /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <RouterProvider router={router} />
      <Toaster />
    </TooltipProvider>
  </StrictMode>,
);

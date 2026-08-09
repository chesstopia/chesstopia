import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest läuft hier ohne `globals: true`. Das automatische Aufräumen der
// Testing Library hängt an einem globalen afterEach und greift deshalb nicht —
// ohne diese Zeile sieht der zweite Test das DOM des ersten.
afterEach(cleanup);

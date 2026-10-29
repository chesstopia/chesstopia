import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest läuft hier ohne `globals: true`. Das automatische Aufräumen der
// Testing Library hängt an einem globalen afterEach und greift deshalb nicht —
// ohne diese Zeile sieht der zweite Test das DOM des ersten.
afterEach(cleanup);

// jsdom implementiert `Element.scrollIntoView` nicht. Der `MoveList`-Test
// spioniert darauf, um zu prüfen, dass die Zugliste die Seite nicht mitscrollt.
Element.prototype.scrollIntoView ??= () => {};

// jsdom implementiert `ResizeObserver` nicht; Radix-Popper (Tooltip) braucht ihn,
// sobald ein Tooltip beim Hover öffnet.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

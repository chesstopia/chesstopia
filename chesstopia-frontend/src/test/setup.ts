import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest läuft hier ohne `globals: true`. Das automatische Aufräumen der
// Testing Library hängt an einem globalen afterEach und greift deshalb nicht —
// ohne diese Zeile sieht der zweite Test das DOM des ersten.
afterEach(cleanup);

// jsdom implementiert `HTMLDialogElement.showModal`/`close` nicht. Minimal
// nachgerüstet: Sie setzen bzw. entfernen nur das `open`-Attribut, das
// `getByRole('dialog')` zur Sichtbarkeit auswertet.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
}

// jsdom implementiert `Element.scrollIntoView` nicht; `MoveList` ruft es beim
// Rendern von Zügen auf. Tests, die den Aufruf prüfen, spionieren darauf.
Element.prototype.scrollIntoView ??= () => {};

// jsdom implementiert `ResizeObserver` nicht; Radix-Popper (Tooltip) braucht ihn,
// sobald ein Tooltip beim Hover öffnet.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

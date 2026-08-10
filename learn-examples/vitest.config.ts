import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Ab Sprosse 3 entstehen echte Knoten. Die Sprossen davor kosten unter
    // jsdom nichts — eine zweite Projektdatei wäre teurer als der Aufpreis.
    environment: 'jsdom',
    include: ['**/*.test.{ts,tsx}'],
    setupFiles: ['./setup.ts'],
  },
});

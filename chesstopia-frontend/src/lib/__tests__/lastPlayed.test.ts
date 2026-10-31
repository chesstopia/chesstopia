import { describe, it, expect } from 'vitest';
import { formatEndedAt, formatLastPlayed } from '../lastPlayed';

describe('lastPlayed', () => {
  // Lokale Zeit, damit die Kalendertag-Grenzen unabhängig von der Zeitzone des Testlaufs sind.
  const now = new Date(2026, 9, 29, 15, 0, 0);
  const iso = (d: Date) => d.toISOString();

  it('unter einer Minute her: „gerade eben“', () => {
    // ACT & ASSERTIONS
    expect(formatLastPlayed(iso(new Date(2026, 9, 29, 14, 59, 30)), now)).toBe('gerade eben');
  });

  it('Zeitpunkt in der Zukunft (Uhrenabweichung): „gerade eben“', () => {
    // ACT & ASSERTIONS
    expect(formatLastPlayed(iso(new Date(2026, 9, 29, 15, 2, 0)), now)).toBe('gerade eben');
  });

  it('unter einer Stunde her: Minuten', () => {
    // ACT & ASSERTIONS
    expect(formatLastPlayed(iso(new Date(2026, 9, 29, 14, 55, 0)), now)).toBe('vor 5 Min.');
  });

  it('am selben Kalendertag: Stunden', () => {
    // ACT & ASSERTIONS
    expect(formatLastPlayed(iso(new Date(2026, 9, 29, 12, 0, 0)), now)).toBe('vor 3 Std.');
  });

  it('am Vortag: „gestern, HH:MM“', () => {
    // ACT & ASSERTIONS
    expect(formatLastPlayed(iso(new Date(2026, 9, 28, 21, 14, 0)), now)).toBe('gestern, 21:14');
  });

  it('im selben Jahr, früher: „TT.MM.“', () => {
    // ACT & ASSERTIONS
    expect(formatLastPlayed(iso(new Date(2026, 9, 24, 10, 0, 0)), now)).toBe('24.10.');
  });

  it('in einem anderen Jahr: „TT.MM.JJJJ“', () => {
    // ACT & ASSERTIONS
    expect(formatLastPlayed(iso(new Date(2025, 9, 24, 10, 0, 0)), now)).toBe('24.10.2025');
  });

  describe('formatEndedAt', () => {
    it('relative Form ohne „am“', () => {
      // ACT & ASSERTIONS
      expect(formatEndedAt(iso(new Date(2026, 9, 29, 14, 59, 30)), now)).toBe('beendet gerade eben');
      expect(formatEndedAt(iso(new Date(2026, 9, 29, 14, 55, 0)), now)).toBe('beendet vor 5 Min.');
      expect(formatEndedAt(iso(new Date(2026, 9, 29, 12, 0, 0)), now)).toBe('beendet vor 3 Std.');
      expect(formatEndedAt(iso(new Date(2026, 9, 28, 21, 14, 0)), now)).toBe('beendet gestern, 21:14');
    });

    it('Datumsform mit „am“', () => {
      // ACT & ASSERTIONS
      expect(formatEndedAt(iso(new Date(2026, 9, 24, 10, 0, 0)), now)).toBe('beendet am 24.10.');
      expect(formatEndedAt(iso(new Date(2025, 9, 24, 10, 0, 0)), now)).toBe('beendet am 24.10.2025');
    });
  });
});

import type { GameSnapshot } from './feedback';
import { outcomeKind } from './outcome';
import type { Side } from './position';

export const BASE_TITLE = 'Chesstopia';

const SEPARATOR = ' · ';
const ATTENTION = '● ';

const OUTCOME_TITLE = { won: 'Schachmatt – gewonnen', lost: 'Schachmatt – verloren', draw: 'Remis' } as const;

/**
 * Der Tab-Titel als reine Funktion des Zustands — gilt auch direkt nach dem
 * Laden. Zuschauer bekommen immer den Basistitel.
 */
export function gameTitle(s: GameSnapshot, role: Side | null): string {
  if (role === null) return BASE_TITLE;
  const kind = outcomeKind(s.status, role);
  if (kind !== null) return OUTCOME_TITLE[kind] + SEPARATOR + BASE_TITLE;
  if (s.sideToMove !== role) return BASE_TITLE;
  return (s.inCheck ? 'Schach!' : 'Du bist am Zug') + SEPARATOR + BASE_TITLE;
}

/** `● ` davor markiert „hier ist etwas passiert, während du weg warst“. */
export function withAttention(title: string, attention: boolean): string {
  return attention ? ATTENTION + title : title;
}

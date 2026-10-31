import type { GameResponse } from '@chesstopia/openapi-client';
import { outcomeKind } from './outcome';
import type { Side } from './position';

/** Was der Spieler hören soll; zugleich die Schlüssel des Sound-Themes. */
export type FeedbackEvent = 'move' | 'check-received' | 'check-given' | 'win' | 'loss' | 'draw';

/** Der Ausschnitt des Partiezustands, aus dem Feedback entsteht. */
export type GameSnapshot = {
  moveCount: number;
  sideToMove: Side;
  inCheck: boolean;
  status: GameResponse['status'];
};

const OUTCOME_EVENT = { won: 'win', lost: 'loss', draw: 'draw' } as const;

/**
 * Das eine Ereignis eines Übergangs von `prev` nach `next`, oder `null`.
 *
 * Der erste Zustand (`prev === null`) ist die Ausgangslage, kein Ereignis —
 * sonst klingelt jedes Öffnen einer Partie. Ein Übergang zählt nur, wenn
 * `moveCount` steigt; so lösen HTTP-Antwort und WS-Echo desselben Zugs nur
 * einmal aus. Vorrang: Partieende > Schach > Zug.
 */
export function detectFeedbackEvent(prev: GameSnapshot | null, next: GameSnapshot, role: Side | null): FeedbackEvent | null {
  if (prev === null || next.moveCount <= prev.moveCount) return null;

  // Nach dem Zug ist die Seite am Zug, die nicht gezogen hat.
  const mover: Side = next.sideToMove === 'w' ? 'b' : 'w';
  const ownMove = role !== null && mover === role;

  if (next.status !== 'ONGOING') {
    if (role === null) return 'draw';
    const kind = outcomeKind(next.status, role);
    return kind === null ? null : OUTCOME_EVENT[kind];
  }
  if (next.inCheck) return role === null || ownMove ? 'check-given' : 'check-received';
  return ownMove ? null : 'move';
}

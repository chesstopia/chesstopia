import type { MoveRequest } from '@chesstopia/openapi-client';
import { parseSquare } from './position';
import type { Board } from './position';
import { fromSquare } from './squares';

/** Die Figur, in die ein Bauer umgewandelt wird. */
export type Promotion = NonNullable<MoveRequest['promotion']>;

/** Die wählbaren Figuren in Anzeigereihenfolge — vom Zielfeld weg. */
export const PROMOTIONS: readonly Promotion[] = ['QUEEN', 'ROOK', 'BISHOP', 'KNIGHT'];

/**
 * Ob der Zug einen eigenen Bauern auf seine letzte Reihe bringt. Darstellungslogik
 * für die Frage, *ob* die Auswahl aufklappt — legal ist der Zug damit noch nicht,
 * das entscheidet allein die Engine (ADR-0001).
 */
export function isPromotion(board: Board, from: string, to: string): boolean {
  const origin = fromSquare(from);
  const piece = board[origin.rankIdx][origin.fileIdx];
  return (piece === 'wP' && to[1] === '8') || (piece === 'bP' && to[1] === '1');
}

/** Baut den Zug für die API. Die Zielfigur zählt nur bei einer Umwandlung. */
export function toMoveRequest(board: Board, from: string, to: string, promotion?: Promotion): MoveRequest {
  return {
    from: parseSquare(from),
    to: parseSquare(to),
    promotion: isPromotion(board, from, to) ? promotion : undefined,
  };
}

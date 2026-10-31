import type { MoveRequest } from '@chesstopia/openapi-client';
import { parseSquare } from './position';
import type { Board } from './position';
import { fromSquare } from './squares';

/** Baut den Zug für die API. Ein Bauer auf der Grundreihe wird immer zur Dame. */
export function toMoveRequest(board: Board, from: string, to: string): MoveRequest {
  const origin = fromSquare(from);
  const isPawn = board[origin.rankIdx][origin.fileIdx]?.[1] === 'P';
  const promotes = to[1] === '8' || to[1] === '1';
  return {
    from: parseSquare(from),
    to: parseSquare(to),
    promotion: isPawn && promotes ? 'QUEEN' : undefined,
  };
}

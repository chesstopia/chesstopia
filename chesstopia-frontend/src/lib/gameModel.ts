import type { GameResponse, MoveRecord } from '@chesstopia/openapi-client';
import type { Side } from './position';

export type Role = Side | null;

/** Der Partiezustand einer Seite, ohne React und ohne IO. */
export type GameModel = {
  /** Pro Mount fest. */
  role: Role;
  game: GameResponse | null;
  loaded: boolean;
  deleted: boolean;
  pending: boolean;
  /** Ein Fehlerfeld: der letzte Schreiber gewinnt; geleert nur beim Start eines legalen Zugs und beim Löschen. */
  error: Error | null;
  moves: MoveRecord[];
};

export type GameAction =
  | { type: 'loadSucceeded'; game: GameResponse }
  | { type: 'loadFailed'; error: Error }
  | { type: 'serverUpdate'; game: GameResponse }
  | { type: 'deleted'; fromLoad: boolean }
  | { type: 'failed'; error: Error }
  | { type: 'moveStarted' }
  | { type: 'moveSettled' }
  | { type: 'historyLoaded'; moves: MoveRecord[] };

export function initGameModel(role: Role): GameModel {
  return { role, game: null, loaded: false, deleted: false, pending: false, error: null, moves: [] };
}

// Stale-Regel: Eine Stellung, die hinter dem gehaltenen `moveCount` zurückfällt, wird verworfen —
// sonst könnte eine verspätete Antwort eine zwischenzeitlich über WS eingetroffene neuere Stellung
// zurückwerfen. Bei Gleichstand gewinnt die neuere Nachricht.
function isStale(s: GameModel, game: GameResponse): boolean {
  return s.game !== null && game.moveCount < s.game.moveCount;
}

/** Verworfene Aktionen geben dasselbe Objekt `s` zurück, damit React keinen Render auslöst. */
export function gameReducer(s: GameModel, a: GameAction): GameModel {
  switch (a.type) {
    case 'loadSucceeded':
      return { ...s, loaded: true, game: isStale(s, a.game) ? s.game : a.game };
    case 'loadFailed':
      return { ...s, loaded: true, error: a.error };
    case 'serverUpdate':
      return isStale(s, a.game) ? s : { ...s, game: a.game };
    case 'deleted':
      return { ...s, deleted: true, error: null, loaded: s.loaded || a.fromLoad };
    case 'failed':
      return { ...s, error: a.error };
    case 'moveStarted':
      return { ...s, pending: true, error: null };
    case 'moveSettled':
      return { ...s, pending: false };
    case 'historyLoaded':
      // Dieselbe Stale-Regel für die Historie: eine verspätete, kürzere Liste wirft keine längere zurück.
      return a.moves.length >= s.moves.length ? { ...s, moves: a.moves } : s;
  }
}

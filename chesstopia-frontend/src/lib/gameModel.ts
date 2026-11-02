import type { GameResponse, MoveRecord } from '@chesstopia/openapi-client';
import { detectFeedbackEvent } from './feedback';
import type { FeedbackEvent, GameSnapshot } from './feedback';
import { sideOf } from './position';
import type { Side } from './position';

export type Role = Side | null;

/**
 * Das zuletzt ausgelöste Feedback. `seq` zählt Übergänge (Ton), `attentionSeq`
 * nur die, nach denen der Spieler selbst am Zug ist (`●` im verborgenen Tab).
 */
export type FeedbackState = { event: FeedbackEvent | null; seq: number; attentionSeq: number };

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
  feedback: FeedbackState;
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
  return { role, game: null, loaded: false, deleted: false, pending: false, error: null, moves: [], feedback: { event: null, seq: 0, attentionSeq: 0 } };
}

// Stale-Regel: Eine Stellung, die hinter dem gehaltenen `moveCount` zurückfällt, wird verworfen —
// sonst könnte eine verspätete Antwort eine zwischenzeitlich über WS eingetroffene neuere Stellung
// zurückwerfen. Bei Gleichstand gewinnt die neuere Nachricht.
function isStale(s: GameModel, game: GameResponse): boolean {
  return s.game !== null && game.moveCount < s.game.moveCount;
}

function snapshotOf(g: GameResponse): GameSnapshot {
  return { moveCount: g.moveCount, sideToMove: sideOf(g.position), checkState: g.checkState, status: g.status };
}

// Ein Übergang zählt nur, wenn `moveCount` steigt: Der erste Stand ist die Ausgangslage, und
// HTTP-Antwort und WS-Echo desselben Zugs lösen nur einmal aus.
function nextFeedback(s: GameModel, game: GameResponse): FeedbackState {
  if (s.game === null || game.moveCount <= s.game.moveCount) return s.feedback;
  // `●` nur für Spieler, und nur wenn der Gegner gezogen hat — also man selbst jetzt am Zug ist.
  const opponentMoved = s.role !== null && sideOf(game.position) === s.role;
  return {
    event: detectFeedbackEvent(snapshotOf(s.game), snapshotOf(game), s.role),
    seq: s.feedback.seq + 1,
    attentionSeq: s.feedback.attentionSeq + (opponentMoved ? 1 : 0),
  };
}

/** Verworfene Aktionen geben dasselbe Objekt `s` zurück, damit React keinen Render auslöst. */
export function gameReducer(s: GameModel, a: GameAction): GameModel {
  switch (a.type) {
    case 'loadSucceeded':
      if (isStale(s, a.game)) return s.loaded ? s : { ...s, loaded: true };
      return { ...s, loaded: true, game: a.game, feedback: nextFeedback(s, a.game) };
    case 'loadFailed':
      return { ...s, loaded: true, error: a.error };
    case 'serverUpdate':
      return isStale(s, a.game) ? s : { ...s, game: a.game, feedback: nextFeedback(s, a.game) };
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

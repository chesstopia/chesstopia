import { useCallback, useEffect, useReducer, useState } from 'react';
import type { GameResponse, MoveRecord } from '@chesstopia/openapi-client';
import { asError, gameApi, isNotFound } from '@/lib/api';
import { isLegalMove } from '@/lib/engine';
import { gameReducer, initGameModel } from '@/lib/gameModel';
import type { FeedbackState, Role } from '@/lib/gameModel';
import { toMoveRequest } from '@/lib/moveRequest';
import { formatSquare, sideOf, toBoard } from '@/lib/position';
import type { Board, Side } from '@/lib/position';
import { addInvitedGame, findGame, inviteTokenOf, playerSideOf, playerTokenOf, removeGame } from '@/lib/gameStorage';
import type { StoredGame } from '@/lib/gameStorage';
import { subscribeToGame } from '@/lib/stomp';

/** Die geladene Partie, wie die Seite sie braucht: Brett statt Stellungsobjekt, Seite am Zug als `Side`. */
export type LoadedGame = {
  board: Board;
  sideToMove: Side;
  status: GameResponse['status'];
  endReason: NonNullable<GameResponse['endReason']> | null;
  checkState: GameResponse['checkState'];
  moveCount: number;
};

export type GameState = {
  /** `null`, solange die Partie nicht geladen ist. */
  game: LoadedGame | null;
  role: Role;
  /** Nur der Ersteller kennt den Einladungstoken. */
  inviteToken: string | null;
  loading: boolean;
  deleted: boolean;
  error: Error | null;
  pending: boolean;
  playMove: (from: string, to: string) => Promise<void>;
  moves: MoveRecord[];
  lastMove: { from: string; to: string } | null;
  feedback: FeedbackState;
};

/**
 * IO-Hülle um `gameReducer`: lädt eine bestehende Partie (kein createGame mehr —
 * die Startseite hat sie angelegt), löst die eigene Rolle über `chesstopia.games`
 * auf und speist die eigene HTTP-Antwort und den WS-Broadcast als Aktionen ein.
 * Zustandsregeln (Stale-Regel, Fehlerfeld, Feedback-Übergang) stehen in `lib/gameModel.ts`.
 * Ein Mount gehört genau einer Partie (`GamePage` rendert mit `key={gameId}`).
 */
export function useGameState(gameId: string, inviteTokenFromUrl: string | null): GameState {
  // Lazy-Initializer statt Effekt: `findGame`/`addInvitedGame` lesen/schreiben
  // `chesstopia.games` genau einmal beim Mount. Ein Effekt, der hier `setEntry`
  // synchron aufruft, verletzt `react-hooks/set-state-in-effect` (Teil des
  // Lint-Vertrags, s. `build.gradle.kts` — `pnpm lint` läuft in `buildAll`);
  // der Lazy-Initializer erreicht dasselbe ohne einen zusätzlichen Render-Tick.
  const [entry] = useState<StoredGame | undefined>(
    () => findGame(gameId) ?? (inviteTokenFromUrl ? addInvitedGame(gameId, inviteTokenFromUrl) : undefined),
  );
  const playerToken = playerTokenOf(entry);
  const [model, dispatch] = useReducer(gameReducer, playerSideOf(entry), initGameModel);
  const { game, deleted, moves } = model;

  const markDeleted = useCallback(
    (fromLoad: boolean) => {
      dispatch({ type: 'deleted', fromLoad });
      removeGame(gameId);
    },
    [gameId],
  );

  // Dispatches stehen nur in Promise- und STOMP-Callbacks, nie synchron im Effekt
  // (`react-hooks/set-state-in-effect`).
  useEffect(() => {
    gameApi
      .getGame(gameId)
      .then((res) => dispatch({ type: 'loadSucceeded', game: res.data }))
      .catch((err: unknown) => {
        if (isNotFound(err)) markDeleted(true);
        else dispatch({ type: 'loadFailed', error: asError(err) });
      });
  }, [gameId, markDeleted]);

  useEffect(() => {
    return subscribeToGame(gameId, {
      onUpdate: (raw) => dispatch({ type: 'serverUpdate', game: JSON.parse(raw) as GameResponse }),
      onDeleted: () => markDeleted(false),
    });
  }, [gameId, markDeleted]);

  const heldMoveCount = game?.moveCount ?? 0;

  // Die Historie wird nachgeladen, sobald `moveCount` der gehaltenen Liste voraus ist.
  useEffect(() => {
    if (heldMoveCount <= moves.length) return;
    gameApi
      .listMoves(gameId)
      .then((res) => dispatch({ type: 'historyLoaded', moves: res.data.moves }))
      .catch((err: unknown) => dispatch({ type: 'failed', error: asError(err) }));
  }, [gameId, heldMoveCount, moves.length]);

  const last = moves.length > 0 ? moves[moves.length - 1].move : null;
  const lastMove = last === null ? null : { from: formatSquare(last.from), to: formatSquare(last.to) };

  const loaded: LoadedGame | null =
    game === null
      ? null
      : {
          board: toBoard(game.position),
          sideToMove: sideOf(game.position),
          status: game.status,
          endReason: game.endReason ?? null,
          checkState: game.checkState,
          moveCount: game.moveCount,
        };

  const playMove = useCallback(
    async (from: string, to: string) => {
      if (deleted || game === null || game.status !== 'ONGOING' || !playerToken) return;

      const move = toMoveRequest(toBoard(game.position), from, to);

      if (!isLegalMove(game.position, move)) {
        dispatch({ type: 'failed', error: new Error('Dieser Zug ist nicht legal.') });
        return;
      }

      dispatch({ type: 'moveStarted' });
      try {
        // `X-Player-Token` ist im Kontrakt ein Header-Parameter
        // (`components/parameters/PlayerToken`) — der generierte Client bildet
        // das auf ein eigenes drittes Argument ab, nicht auf `options.headers`.
        const res = await gameApi.playMove(gameId, move, playerToken);
        dispatch({ type: 'serverUpdate', game: res.data });
      } catch (err: unknown) {
        if (isNotFound(err)) markDeleted(false);
        else dispatch({ type: 'failed', error: asError(err) });
      } finally {
        dispatch({ type: 'moveSettled' });
      }
    },
    [gameId, game, playerToken, deleted, markDeleted],
  );

  return {
    game: loaded,
    role: model.role,
    inviteToken: inviteTokenOf(entry),
    loading: !model.loaded,
    deleted,
    error: model.error,
    pending: model.pending,
    playMove,
    moves,
    lastMove,
    feedback: model.feedback,
  };
}

import { useCallback, useEffect, useState } from 'react';
import type { GameResponse, MoveRecord, MoveRequest } from '@chesstopia/openapi-client';
import { asError, gameApi, isNotFound } from '@/lib/api';
import { isLegalMove } from '@/lib/engine';
import { formatSquare, parseSquare, sideOf, toBoard } from '@/lib/position';
import type { Board, Side } from '@/lib/position';
import { fromSquare } from '@/lib/squares';
import { addInvitedGame, findGame, inviteTokenOf, playerSideOf, playerTokenOf, removeGame } from '@/lib/gameStorage';
import type { StoredGame } from '@/lib/gameStorage';
import { subscribeToGame } from '@/lib/stomp';

export type Role = Side | null;

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
};

/**
 * Lädt eine bestehende Partie (kein createGame mehr — die Startseite hat sie
 * angelegt), löst die eigene Rolle über `chesstopia.games` auf und hält den
 * State über zwei Quellen aktuell: die eigene HTTP-Antwort und den WS-
 * Broadcast. Beide werden nur übernommen, wenn ihr `moveCount` nicht hinter
 * dem bereits gehaltenen zurückfällt — sonst könnte eine verspätete Antwort
 * eine zwischenzeitlich über WS eingetroffene neuere Stellung zurückwerfen.
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
  const [game, setGame] = useState<GameResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [moves, setMoves] = useState<MoveRecord[]>([]);

  // Aus `loadedFor` abgeleitet statt eines eigenen `loading`-States: Ein
  // Effekt, der bei jeder `gameId`-Änderung `setLoading(true)` synchron
  // aufruft, wäre derselbe Lint-Verstoß wie oben. So ist "lädt" automatisch
  // wahr, bis die Antwort für genau diese `gameId` eingetroffen ist.
  const loading = loadedFor !== gameId;

  const role: Role = playerSideOf(entry);
  const playerToken = playerTokenOf(entry);

  // Stale-Regel: Eine Antwort, die hinter dem gehaltenen `moveCount` zurückfällt, wird verworfen;
  // bei Gleichstand gewinnt die neuere Nachricht.
  const applyResponse = useCallback((data: GameResponse) => {
    setGame((held) => (held !== null && data.moveCount < held.moveCount ? held : data));
  }, []);

  const markDeleted = useCallback(() => {
    setDeleted(true);
    setError(null);
    removeGame(gameId);
  }, [gameId]);

  useEffect(() => {
    gameApi
      .getGame(gameId)
      .then((res) => applyResponse(res.data))
      .catch((err: unknown) => {
        if (isNotFound(err)) markDeleted();
        else setError(asError(err));
      })
      .finally(() => setLoadedFor(gameId));
  }, [gameId, applyResponse, markDeleted]);

  useEffect(() => {
    return subscribeToGame(gameId, {
      onUpdate: (raw) => applyResponse(JSON.parse(raw) as GameResponse),
      onDeleted: markDeleted,
    });
  }, [gameId, applyResponse, markDeleted]);

  const heldMoveCount = game?.moveCount ?? 0;

  // Die Historie wird nachgeladen, sobald `moveCount` der gehaltenen Liste
  // voraus ist. Eine Antwort gilt nur, wenn sie mindestens so lang ist wie die
  // gehaltene Liste — dieselbe Stale-Regel wie bei `applyResponse`: eine
  // verspätete, kürzere Antwort darf keine neuere Liste zurückwerfen.
  // `setMoves` steht im Promise-Callback, nicht synchron im Effekt
  // (`react-hooks/set-state-in-effect`).
  useEffect(() => {
    if (heldMoveCount <= moves.length) return;
    gameApi
      .listMoves(gameId)
      .then((res) => setMoves((held) => (res.data.moves.length >= held.length ? res.data.moves : held)))
      .catch((err: unknown) => setError(asError(err)));
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

      const origin = fromSquare(from);
      const isPawn = toBoard(game.position)[origin.rankIdx][origin.fileIdx]?.[1] === 'P';
      const promotes = to[1] === '8' || to[1] === '1';
      const move: MoveRequest = {
        from: parseSquare(from),
        to: parseSquare(to),
        promotion: isPawn && promotes ? 'QUEEN' : undefined,
      };

      if (!isLegalMove(game.position, move)) {
        setError(new Error('Dieser Zug ist nicht legal.'));
        return;
      }

      setPending(true);
      setError(null);
      try {
        // `X-Player-Token` ist im Kontrakt ein Header-Parameter
        // (`components/parameters/PlayerToken`) — der generierte Client bildet
        // das auf ein eigenes drittes Argument ab, nicht auf `options.headers`.
        const res = await gameApi.playMove(gameId, move, playerToken);
        applyResponse(res.data);
      } catch (err: unknown) {
        if (isNotFound(err)) markDeleted();
        else setError(asError(err));
      } finally {
        setPending(false);
      }
    },
    [gameId, game, playerToken, deleted, applyResponse, markDeleted],
  );

  return { game: loaded, role, inviteToken: inviteTokenOf(entry), loading, deleted, error, pending, playMove, moves, lastMove };
}

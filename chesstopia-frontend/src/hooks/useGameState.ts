import { useCallback, useEffect, useRef, useState } from 'react';
import { GameApi } from '@chesstopia/openapi-client';
import type { GameResponse, MoveRequest, Position } from '@chesstopia/openapi-client';
import { apiConfig } from '@/lib/api';
import { isLegalMove } from '@/lib/engine';
import { parseSquare, sideOf, toBoard } from '@/lib/position';
import type { Board, Side } from '@/lib/position';
import { fromSquare } from '@/lib/squares';
import { addInvitedGame, findGame } from '@/lib/gameStorage';
import type { StoredGame } from '@/lib/gameStorage';
import { subscribeToGame } from '@/lib/stomp';

const gameApi = new GameApi(apiConfig);

function asError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

export type Role = Side | null;

/**
 * Lädt eine bestehende Partie (kein createGame mehr — die Startseite hat sie
 * angelegt), löst die eigene Rolle über `chesstopia.games` auf und hält den
 * State über zwei Quellen aktuell: die eigene HTTP-Antwort und den WS-
 * Broadcast. Beide werden nur übernommen, wenn ihr `moveCount` nicht hinter
 * dem bereits gehaltenen zurückfällt — sonst könnte eine verspätete Antwort
 * eine zwischenzeitlich über WS eingetroffene neuere Stellung zurückwerfen.
 */
export function useGameState(gameId: string, inviteTokenFromUrl: string | null) {
  // Lazy-Initializer statt Effekt: `findGame`/`addInvitedGame` lesen/schreiben
  // `chesstopia.games` genau einmal beim Mount. Ein Effekt, der hier `setEntry`
  // synchron aufruft, verletzt `react-hooks/set-state-in-effect` (Teil des
  // Lint-Vertrags, s. `build.gradle.kts` — `pnpm lint` läuft in `buildAll`);
  // der Lazy-Initializer erreicht dasselbe ohne einen zusätzlichen Render-Tick.
  const [entry] = useState<StoredGame | undefined>(
    () => findGame(gameId) ?? (inviteTokenFromUrl ? addInvitedGame(gameId, inviteTokenFromUrl) : undefined),
  );
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<GameResponse['status']>('ONGOING');
  const [endReason, setEndReason] = useState<GameResponse['endReason'] | null>(null);
  const moveCountRef = useRef(-1);

  // Aus `loadedFor` abgeleitet statt eines eigenen `loading`-States: Ein
  // Effekt, der bei jeder `gameId`-Änderung `setLoading(true)` synchron
  // aufruft, wäre derselbe Lint-Verstoß wie oben. So ist "lädt" automatisch
  // wahr, bis die Antwort für genau diese `gameId` eingetroffen ist.
  const loading = loadedFor !== gameId;

  const role: Role = entry?.role === 'OWNER' ? 'w' : entry?.role === 'INVITED' ? 'b' : null;
  const playerToken = entry?.role === 'OWNER' ? entry.ownerToken : entry?.role === 'INVITED' ? entry.inviteToken : undefined;

  const applyResponse = useCallback((data: GameResponse) => {
    if (data.moveCount < moveCountRef.current) return;
    moveCountRef.current = data.moveCount;
    setPosition(data.position);
    setStatus(data.status);
    setEndReason(data.endReason ?? null);
  }, []);

  useEffect(() => {
    gameApi
      .getGame(gameId)
      .then((res) => applyResponse(res.data))
      .catch((err: unknown) => setError(asError(err)))
      .finally(() => setLoadedFor(gameId));
  }, [gameId, applyResponse]);

  useEffect(() => {
    return subscribeToGame(gameId, (raw) => applyResponse(JSON.parse(raw) as GameResponse));
  }, [gameId, applyResponse]);

  const board: Board | null = position === null ? null : toBoard(position);
  const sideToMove: Side | null = position === null ? null : sideOf(position);

  const playMove = useCallback(
    async (from: string, to: string) => {
      if (position === null || status !== 'ONGOING' || !playerToken) return;

      const origin = fromSquare(from);
      const isPawn = toBoard(position)[origin.rankIdx][origin.fileIdx]?.[1] === 'P';
      const promotes = to[1] === '8' || to[1] === '1';
      const move: MoveRequest = {
        from: parseSquare(from),
        to: parseSquare(to),
        promotion: isPawn && promotes ? 'QUEEN' : undefined,
      };

      if (!isLegalMove(position, move)) {
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
        setError(asError(err));
      } finally {
        setPending(false);
      }
    },
    [gameId, position, status, playerToken, applyResponse],
  );

  return { board, position, sideToMove, status, endReason, error, loading, pending, role, entry, playMove };
}

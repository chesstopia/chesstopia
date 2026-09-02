import { useCallback, useEffect, useState } from 'react';
import { GameApi } from '@chesstopia/openapi-client';
import type { MoveRequest, Position } from '@chesstopia/openapi-client';
import { apiConfig } from '@/lib/api';
import { parseSquare, sideOf, toBoard } from '@/lib/position';
import type { Board, Side } from '@/lib/position';
import { fromSquare } from '@/lib/squares';

const gameApi = new GameApi(apiConfig);

function asError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * Hält die Stellung einer Partie und kann sie weiterbewegen.
 *
 * Der Hook rechnet nicht, er fragt: Welche Stellung nach einem Zug gilt,
 * entscheidet das Backend, und dort die Schach-Engine. Was hier steht, ist
 * ausschließlich die Übersetzung zwischen Zeigergeste und Kontrakt.
 */
export function useBoardState() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    gameApi
      .createGame()
      .then((res) => {
        setGameId(res.data.id);
        setPosition(res.data.position);
      })
      .catch((err: unknown) => setError(asError(err)))
      .finally(() => setLoading(false));
  }, []);

  const board: Board | null = position === null ? null : toBoard(position);
  const sideToMove: Side | null = position === null ? null : sideOf(position);

  const playMove = useCallback(
    async (from: string, to: string) => {
      if (gameId === null || position === null) return;

      // Die Wahl der Umwandlungsfigur ist eine Eingabe, keine Regel: Dass ein
      // Bauer auf der Grundreihe umwandeln *muss*, erzwingt die Engine — sie
      // lehnt den Zug ohne Zielfigur ab. Welche es wird, beantwortet die
      // Oberfläche hier vorerst mit der Dame.
      const origin = fromSquare(from);
      const isPawn = toBoard(position)[origin.rankIdx][origin.fileIdx]?.[1] === 'P';
      const promotes = to[1] === '8' || to[1] === '1';
      const move: MoveRequest = {
        from: parseSquare(from),
        to: parseSquare(to),
        promotion: isPawn && promotes ? 'QUEEN' : undefined,
      };

      setPending(true);
      setError(null);
      try {
        const res = await gameApi.playMove(gameId, move);
        setPosition(res.data.position);
      } catch (err: unknown) {
        setError(asError(err));
      } finally {
        setPending(false);
      }
    },
    [gameId, position],
  );

  return { board, position, gameId, sideToMove, error, loading, pending, playMove };
}

import { useCallback, useEffect, useState } from 'react';
import { GameApi } from '@chesstopia/openapi-client';
import { parseFenBoard, parseFenSideToMove } from '@/lib/fen';
import type { Board, Side } from '@/lib/fen';
import { fromSquare } from '@/lib/squares';

const gameApi = new GameApi();

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
  const [fen, setFen] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    gameApi
      .createGame()
      .then((res) => {
        setGameId(res.data.id);
        setFen(res.data.fen);
      })
      .catch((err: unknown) => setError(asError(err)))
      .finally(() => setLoading(false));
  }, []);

  const board: Board | null = fen === null ? null : parseFenBoard(fen);
  const sideToMove: Side | null = fen === null ? null : parseFenSideToMove(fen);

  const playMove = useCallback(
    async (from: string, to: string) => {
      if (gameId === null || fen === null) return;

      // Die Wahl der Umwandlungsfigur ist eine Eingabe, keine Regel: Dass ein
      // Bauer auf der Grundreihe umwandeln *muss*, erzwingt die Engine — sie
      // lehnt den Zug ohne Zielfigur ab. Welche es wird, beantwortet die
      // Oberfläche hier vorerst mit der Dame.
      const origin = fromSquare(from);
      const isPawn = parseFenBoard(fen)[origin.rankIdx][origin.fileIdx]?.[1] === 'P';
      const promotes = to[1] === '8' || to[1] === '1';
      const uci = `${from}${to}${isPawn && promotes ? 'q' : ''}`;

      setPending(true);
      setError(null);
      try {
        const res = await gameApi.playMove(gameId, { uci });
        setFen(res.data.fen);
      } catch (err: unknown) {
        setError(asError(err));
      } finally {
        setPending(false);
      }
    },
    [gameId, fen],
  );

  return { board, fen, gameId, sideToMove, error, loading, pending, playMove };
}

import { useEffect, useState } from 'react';
import { GameApi } from '@chesstopia/openapi-client';
import { parseFenBoard } from '@/lib/fen';
import type { Board } from '@/lib/fen';

const gameApi = new GameApi();

export function useBoardState() {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gameApi
      .getBoard()
      .then((res) => setBoard(parseFenBoard(res.data.fen)))
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, []);

  return { board, error, loading };
}

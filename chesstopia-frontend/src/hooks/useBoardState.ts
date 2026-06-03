import { useEffect, useState } from 'react';
import { GameApi } from '@chesstopia/openapi-client';
import type { BoardStateResponse } from '@chesstopia/openapi-client';

const gameApi = new GameApi();

export function useBoardState() {
  const [boardState, setBoardState] = useState<BoardStateResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gameApi
      .getBoard()
      .then((res) => setBoardState(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, []);

  return { boardState, error, loading };
}

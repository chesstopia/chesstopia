import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { GameApi } from '@chesstopia/openapi-client';
import type { GameResponse } from '@chesstopia/openapi-client';
import { apiConfig } from '@/lib/api';
import { addOwnedGame, myGames } from '@/lib/gameStorage';
import { Button } from '@/components/ui/button';

const gameApi = new GameApi(apiConfig);

const STATUS_LABEL: Record<string, string> = {
  ONGOING: 'Läuft',
  WHITE_WON: 'Weiß hat gewonnen',
  BLACK_WON: 'Schwarz hat gewonnen',
  DRAW: 'Remis',
};

type Row = { gameId: string; label: string; unavailable?: false } | { gameId: string; unavailable: true };

function statusLabel(response: GameResponse): string {
  const base = STATUS_LABEL[response.status] ?? response.status;
  return response.endReason ? `${base} (${response.endReason})` : base;
}

export function StartPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      myGames().map(async ({ gameId }): Promise<Row> => {
        try {
          const res = await gameApi.getGame(gameId);
          return { gameId, label: statusLabel(res.data) };
        } catch {
          return { gameId, unavailable: true };
        }
      }),
    ).then((results) => {
      if (!cancelled) setRows(results);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const createGame = async () => {
    setCreating(true);
    try {
      const res = await gameApi.createGame();
      addOwnedGame(res.data.id, res.data.ownerToken, res.data.inviteToken);
      navigate(`/game/${res.data.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-900 text-stone-200">
      <h1 className="text-2xl font-semibold">Chesstopia</h1>
      <Button onClick={createGame} disabled={creating}>
        Neue Partie starten
      </Button>
      {rows.length > 0 && (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.gameId} className="flex items-center gap-3">
              {row.unavailable ? (
                <span className="text-stone-500">Partie nicht verfügbar</span>
              ) : (
                <>
                  <span>{row.label}</span>
                  <Link className="underline" to={`/game/${row.gameId}`}>
                    Öffnen
                  </Link>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

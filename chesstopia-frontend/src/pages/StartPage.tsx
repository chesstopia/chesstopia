import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { GameApi } from '@chesstopia/openapi-client';
import type { GameResponse } from '@chesstopia/openapi-client';
import { apiConfig, isNotFound } from '@/lib/api';
import { addOwnedGame, myGames, removeGame } from '@/lib/gameStorage';
import { Button } from '@/components/ui/button';
import { DeleteGameDialog } from '@/components/DeleteGameDialog';

const gameApi = new GameApi(apiConfig);

const STATUS_LABEL: Record<string, string> = {
  ONGOING: 'Läuft',
  WHITE_WON: 'Weiß hat gewonnen',
  BLACK_WON: 'Schwarz hat gewonnen',
  DRAW: 'Remis',
};

type Row = ({ gameId: string; label: string; unavailable?: false } | { gameId: string; unavailable: true }) & {
  deleteError?: string;
};

function statusLabel(response: GameResponse): string {
  const base = STATUS_LABEL[response.status] ?? response.status;
  return response.endReason ? `${base} (${response.endReason})` : base;
}

export function StartPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const deleting = useRef(false);

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
    setError(null);
    try {
      const res = await gameApi.createGame();
      addOwnedGame(res.data.id, res.data.ownerToken, res.data.inviteToken);
      navigate(`/game/${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Partie konnte nicht angelegt werden'));
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    const gameId = pendingDelete;
    if (gameId === null || deleting.current) return;
    deleting.current = true;
    setPendingDelete(null);
    const ownerToken = myGames().find((g) => g.gameId === gameId)?.ownerToken;
    try {
      await gameApi.deleteGame(gameId, ownerToken);
      removeGame(gameId);
      setRows((current) => current.filter((r) => r.gameId !== gameId));
    } catch (err) {
      if (isNotFound(err)) {
        removeGame(gameId);
        setRows((current) => current.filter((r) => r.gameId !== gameId));
      } else {
        const message = err instanceof Error ? err.message : 'Partie konnte nicht gelöscht werden';
        setRows((current) => current.map((r) => (r.gameId === gameId ? { ...r, deleteError: message } : r)));
      }
    } finally {
      deleting.current = false;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-900 text-stone-200">
      <h1 className="text-2xl font-semibold">Chesstopia</h1>
      <Button onClick={createGame} disabled={creating}>
        Neue Partie starten
      </Button>
      {error && <p className="text-red-400">Fehler: {error.message}</p>}
      {rows.length > 0 && (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.gameId} data-game-id={row.gameId} className="flex items-center gap-3">
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
              <Button variant="outline" size="sm" onClick={() => setPendingDelete(row.gameId)}>
                Löschen
              </Button>
              {row.deleteError && <span className="text-red-400">Fehler: {row.deleteError}</span>}
            </li>
          ))}
        </ul>
      )}
      <DeleteGameDialog open={pendingDelete !== null} onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />
    </main>
  );
}

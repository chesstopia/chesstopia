import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { GameApi } from '@chesstopia/openapi-client';
import type { GameResponse } from '@chesstopia/openapi-client';
import { apiConfig, isNotFound } from '@/lib/api';
import { addOwnedGame, allGames, myGames, removeGame, type GameRole } from '@/lib/gameStorage';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { GameRow } from '@/components/start/GameRow';

const gameApi = new GameApi(apiConfig);

type Row = {
  gameId: string;
  role: GameRole;
  /** `null`, wenn die Partie nicht mehr abrufbar ist. */
  game: GameResponse | null;
  deleteError?: string;
};

/** Neueste zuerst; nicht abrufbare Partien (ohne Zeitstempel) ans Ende. */
function byRecency(a: Row, b: Row): number {
  return (b.game?.lastActivityAt ?? '').localeCompare(a.game?.lastActivityAt ?? '');
}

export function StartPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(() => allGames().length > 0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pending, setPending] = useState<{ gameId: string; kind: 'delete' | 'remove' } | null>(null);
  const [deletingNow, setDeletingNow] = useState(false);
  const deleting = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      allGames().map(async ({ gameId, role }): Promise<Row> => {
        try {
          const res = await gameApi.getGame(gameId);
          return { gameId, role, game: res.data };
        } catch {
          return { gameId, role, game: null };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      setRows(results);
      setLoading(false);
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

  const confirmRemove = () => {
    const gameId = pending?.gameId;
    setPending(null);
    if (gameId === undefined) return;
    // Nur die Merkliste: Löschen darf serverseitig allein der Ersteller.
    removeGame(gameId);
    setRows((current) => current.filter((r) => r.gameId !== gameId));
  };

  const confirmDelete = async () => {
    const gameId = pending?.gameId;
    if (gameId === undefined || deleting.current) return;
    deleting.current = true;
    setDeletingNow(true);
    setPending(null);
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
      setDeletingNow(false);
    }
  };

  const now = new Date();
  const ongoing = rows.filter((r) => r.game?.status === 'ONGOING').sort(byRecency);
  const finished = rows.filter((r) => r.game?.status !== 'ONGOING').sort(byRecency);

  const newGameButton = (
    <Button onClick={createGame} disabled={creating}>
      <Plus /> Neue Partie
    </Button>
  );

  const section = (title: string, list: Row[]) =>
    list.length > 0 && (
      <section className="flex flex-col gap-2">
        <h2 className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
        <ul className="flex flex-col gap-2">
          {list.map((row) => (
            <GameRow
              key={row.gameId}
              gameId={row.gameId}
              role={row.role}
              game={row.game}
              now={now}
              disabled={deletingNow}
              error={row.deleteError}
              onDelete={() => setPending({ gameId: row.gameId, kind: 'delete' })}
              onRemove={() => setPending({ gameId: row.gameId, kind: 'remove' })}
            />
          ))}
        </ul>
      </section>
    );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-2 px-4 py-6">
      <header className="mb-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          <span aria-hidden="true">♞</span> Chesstopia
        </h1>
        {(loading || rows.length > 0) && newGameButton}
      </header>
      {error && <p className="text-destructive">Fehler: {error.message}</p>}
      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {allGames().map(({ gameId }) => (
            <Skeleton key={gameId} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 text-center text-muted-foreground">
          <p>Noch keine Partien. Starte eine neue und lade jemanden ein.</p>
          {newGameButton}
        </div>
      ) : (
        <>
          {section('Laufend', ongoing)}
          {section('Beendet', finished)}
        </>
      )}
      <ConfirmDialog
        open={pending?.kind === 'delete'}
        title="Partie löschen?"
        description="Partie wirklich löschen? Das lässt sich nicht rückgängig machen."
        confirmLabel="Löschen"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === 'remove'}
        title="Partie aus Liste entfernen?"
        description="Die Partie selbst bleibt bestehen und ist über den Einladungslink wieder erreichbar."
        confirmLabel="Entfernen"
        onConfirm={confirmRemove}
        onCancel={() => setPending(null)}
      />
    </main>
  );
}

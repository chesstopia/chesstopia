import { Link, useParams, useSearchParams } from 'react-router';
import { Chessboard } from '@/components/board/Chessboard';
import { GameResultBanner } from '@/components/GameResultBanner';
import { useGameState } from '@/hooks/useGameState';

export function GamePage() {
  const { gameId } = useParams() as { gameId: string };
  const [searchParams] = useSearchParams();
  const inviteTokenFromUrl = searchParams.get('invite');

  const { board, sideToMove, status, endReason, error, loading, pending, role, entry, playMove } =
    useGameState(gameId, inviteTokenFromUrl);
  const over = status !== 'ONGOING';
  const myTurn = role !== null && role === sideToMove;

  const inviteLink =
    entry?.role === 'OWNER' ? `${location.origin}/game/${gameId}?invite=${entry.inviteToken}` : null;
  const spectatorLink = `${location.origin}/game/${gameId}`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-900">
      <Link to="/" className="text-stone-400 underline">
        Zur Übersicht
      </Link>
      {loading && <p className="text-stone-400">Lade Brett…</p>}
      {board && (
        <Chessboard
          board={board}
          sideToMove={sideToMove ?? 'w'}
          onMove={playMove}
          disabled={pending || over || !myTurn}
        />
      )}
      {board && !over && (
        <p className="text-stone-400">
          {role === null ? 'Zuschauer' : pending ? 'Zug wird gespielt…' : myTurn ? 'Du bist am Zug' : 'Gegner ist am Zug'}
        </p>
      )}
      <GameResultBanner status={status} endReason={endReason} />
      {error && <p className="text-red-400">Fehler: {error.message}</p>}
      {inviteLink && (
        <div className="flex flex-col items-center gap-1 text-sm text-stone-400">
          <p>
            Einladungslink: <code>{inviteLink}</code>
          </p>
          <p>
            Zuschauer-Link: <code>{spectatorLink}</code>
          </p>
        </div>
      )}
    </main>
  );
}

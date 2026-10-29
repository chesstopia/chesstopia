import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { RefreshCw } from 'lucide-react';
import { Chessboard } from '@/components/board/Chessboard';
import { GameResultBanner } from '@/components/GameResultBanner';
import { InviteButtons } from '@/components/game/InviteButtons';
import { MoveList } from '@/components/game/MoveList';
import { PlayerRow } from '@/components/game/PlayerRow';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useGameState } from '@/hooks/useGameState';
import type { Side } from '@/lib/position';

const SIDE_NAME: Record<Side, string> = { w: 'Weiß', b: 'Schwarz' };

export function GamePage() {
  const { gameId } = useParams() as { gameId: string };
  const [searchParams] = useSearchParams();
  const inviteTokenFromUrl = searchParams.get('invite');

  const {
    board, sideToMove, status, endReason, error, loading, pending, role, entry, deleted, playMove, moves, lastMove,
  } = useGameState(gameId, inviteTokenFromUrl);
  // Zuschauer wählen die Ansicht selbst; sie wird nicht gespeichert.
  const [spectatorFlipped, setSpectatorFlipped] = useState(false);

  const over = status !== 'ONGOING';
  const myTurn = role !== null && role === sideToMove;
  const orientation: Side = role ?? (spectatorFlipped ? 'b' : 'w');
  const opponentSide: Side = orientation === 'w' ? 'b' : 'w';
  const showTurn = board && !over && !deleted;

  const inviteLink =
    entry?.role === 'OWNER' ? `${location.origin}/game/${gameId}?invite=${entry.inviteToken}` : null;
  const spectatorLink = `${location.origin}/game/${gameId}`;

  const label = (side: Side) =>
    role === null ? SIDE_NAME[side] : `${side === role ? 'Du' : 'Gegner'} · ${SIDE_NAME[side]}`;
  const turnState = role === null ? 'zuschauer' : pending ? 'zug-wird-gespielt' : myTurn ? 'du-bist-am-zug' : 'gegner-ist-am-zug';
  const turnText = { zuschauer: 'Zuschauer', 'zug-wird-gespielt': 'Zug wird gespielt…', 'du-bist-am-zug': 'Du bist am Zug', 'gegner-ist-am-zug': 'Gegner ist am Zug' }[turnState];

  return (
    // `--board-chrome`: Kopfzeile, zwei Spielerzeilen und Abstände, die das Brett von 100dvh abzieht.
    <main key={gameId} className="mx-auto flex max-w-6xl flex-col gap-4 p-4" style={{ '--board-chrome': '11rem' } as React.CSSProperties}>
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground underline">
          ← Meine Partien
        </Link>
        {showTurn && (
          <p data-turn-indicator={turnState} className="text-sm text-muted-foreground">
            {turnText}
          </p>
        )}
      </div>
      {loading && <p className="text-muted-foreground">Lade Brett…</p>}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {board && (
          <div className="flex min-w-0 flex-col gap-2">
            <div className="w-[clamp(280px,min(100%,calc(100dvh-var(--board-chrome,0px))),720px)] max-w-full">
              <PlayerRow side={opponentSide} label={label(opponentSide)} active={!over && sideToMove === opponentSide} />
            </div>
            <Chessboard
              board={board}
              sideToMove={sideToMove ?? 'w'}
              onMove={playMove}
              disabled={deleted || pending || over || !myTurn}
              orientation={orientation}
              lastMove={lastMove}
            />
            <div className="w-[clamp(280px,min(100%,calc(100dvh-var(--board-chrome,0px))),720px)] max-w-full">
              <PlayerRow side={orientation} label={label(orientation)} active={!over && sideToMove === orientation} />
            </div>
          </div>
        )}
        <aside className="flex flex-col gap-4">
          <GameResultBanner status={status} endReason={endReason} role={role} />
          {deleted && (
            <Alert className="flex flex-col gap-1">
              <p>Diese Partie wurde gelöscht.</p>
              <Link to="/" className="underline">
                Zur Startseite
              </Link>
            </Alert>
          )}
          {error && !deleted && (
            <Alert variant="destructive">
              <p>Fehler: {error.message}</p>
            </Alert>
          )}
          <MoveList moves={moves} />
          {inviteLink && <InviteButtons inviteLink={inviteLink} spectatorLink={spectatorLink} />}
          {board && role === null && (
            <Button variant="outline" onClick={() => setSpectatorFlipped((f) => !f)}>
              <RefreshCw /> Brett drehen
            </Button>
          )}
        </aside>
      </div>
    </main>
  );
}

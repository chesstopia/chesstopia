import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { RefreshCw } from 'lucide-react';
import { Chessboard, type KingMarker } from '@/components/board/Chessboard';
import { GameResultBanner } from '@/components/GameResultBanner';
import { InviteButtons } from '@/components/game/InviteButtons';
import { MoveList } from '@/components/game/MoveList';
import { PlayerRow } from '@/components/game/PlayerRow';
import { SoundToggle } from '@/components/sound/SoundToggle';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useGameFeedback } from '@/hooks/useGameFeedback';
import { useGameState } from '@/hooks/useGameState';
import { kingSquare, type Side } from '@/lib/position';

const SIDE_NAME: Record<Side, string> = { w: 'Weiß', b: 'Schwarz' };

export function GamePage() {
  const { gameId } = useParams() as { gameId: string };
  const [searchParams] = useSearchParams();
  const inviteTokenFromUrl = searchParams.get('invite');

  const {
    board, sideToMove, inCheck, moveCount, status, endReason, error, loading, pending, role, entry, deleted, playMove, moves,
    lastMove,
  } = useGameState(gameId, inviteTokenFromUrl);
  const { animateCheck } = useGameFeedback({ role, moveCount, sideToMove, inCheck, status });
  // Zuschauer wählen die Ansicht selbst; sie wird nicht gespeichert.
  const [spectatorFlipped, setSpectatorFlipped] = useState(false);

  const over = status !== 'ONGOING';
  const myTurn = role !== null && role === sideToMove;
  const orientation: Side = role ?? (spectatorFlipped ? 'b' : 'w');
  const opponentSide: Side = orientation === 'w' ? 'b' : 'w';
  const showTurn = board && !over && !deleted;

  // Im Schach steht immer die Seite am Zug; nach dem Matt bleibt ihr König markiert.
  const checkedKing = board && sideToMove && inCheck ? kingSquare(board, sideToMove) : null;
  const kingMarker: KingMarker | null = checkedKing ? { square: checkedKing, kind: over ? 'mate' : 'check' } : null;
  const checkBadge = (side: Side) => inCheck && !over && sideToMove === side;

  const inviteLink =
    entry?.role === 'OWNER' ? `${location.origin}/game/${gameId}?invite=${entry.inviteToken}` : null;
  const spectatorLink = `${location.origin}/game/${gameId}`;

  const label = (side: Side) =>
    role === null ? SIDE_NAME[side] : `${side === role ? 'Du' : 'Gegner'} · ${SIDE_NAME[side]}`;
  const turnState = role === null ? 'zuschauer' : pending ? 'zug-wird-gespielt' : myTurn ? 'du-bist-am-zug' : 'gegner-ist-am-zug';
  // Hinweis in der eigenen Zeile; beim Zug des Gegners spricht dessen hervorgehobene Zeile.
  const ownNote = { zuschauer: undefined, 'zug-wird-gespielt': 'Zug wird gespielt…', 'du-bist-am-zug': 'Du bist am Zug', 'gegner-ist-am-zug': undefined }[turnState];

  return (
    <main key={gameId} className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground underline">
          ← Meine Partien
        </Link>
        <SoundToggle />
      </div>
      {loading && <p className="text-muted-foreground">Lade Brett…</p>}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {board && (
          // `--board-size`: Brett und Spielerzeilen teilen sich die Breite. 11rem ist der Platz für
          // Kopfzeile, zwei Spielerzeilen und Abstände, den das Brett von 100dvh abzieht.
          <div
            data-board-column
            className="flex min-w-0 flex-col gap-2"
            style={{ '--board-size': 'clamp(280px, min(100%, calc(100dvh - 11rem)), 720px)' } as React.CSSProperties}
          >
            <div className="w-[var(--board-size)] max-w-full">
              <PlayerRow
                side={opponentSide}
                label={label(opponentSide)}
                active={!over && sideToMove === opponentSide}
                check={checkBadge(opponentSide)}
              />
            </div>
            <Chessboard
              board={board}
              sideToMove={sideToMove ?? 'w'}
              onMove={playMove}
              disabled={deleted || pending || over || !myTurn}
              orientation={orientation}
              lastMove={lastMove}
              kingMarker={kingMarker}
              animateCheck={animateCheck}
              ended={over}
            />
            <div
              data-turn-indicator={showTurn ? turnState : undefined}
              className="w-[var(--board-size)] max-w-full"
            >
              <PlayerRow
                side={orientation}
                label={label(orientation)}
                active={!over && sideToMove === orientation}
                note={showTurn ? ownNote : undefined}
                check={checkBadge(orientation)}
              />
            </div>
            <div className="w-[var(--board-size)] max-w-full">
              <GameResultBanner status={status} endReason={endReason} role={role} />
            </div>
          </div>
        )}
        <aside className="flex flex-col gap-4">
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

import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { RefreshCw } from 'lucide-react';
import { Chessboard } from '@/components/board/Chessboard';
import { GameResultBanner } from '@/components/GameResultBanner';
import { InviteButtons } from '@/components/game/InviteButtons';
import { MoveList } from '@/components/game/MoveList';
import { PlayerRow } from '@/components/game/PlayerRow';
import { SoundToggle } from '@/components/sound/SoundToggle';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useGameState } from '@/hooks/useGameState';
import { useMoveSound } from '@/hooks/useMoveSound';
import { useTabTitle } from '@/hooks/useTabTitle';
import { BASE_TITLE, gameTitle } from '@/lib/gameTitle';
import { deriveGameView } from '@/lib/gameView';

export function GamePage() {
  const { gameId } = useParams() as { gameId: string };
  const [searchParams] = useSearchParams();
  // `key`: Eine andere Partie mountet die Seite neu, damit kein Zustand der vorigen stehen bleibt.
  return <LoadedGamePage key={gameId} gameId={gameId} inviteTokenFromUrl={searchParams.get('invite')} />;
}

function LoadedGamePage({ gameId, inviteTokenFromUrl }: { gameId: string; inviteTokenFromUrl: string | null }) {
  const { game, error, loading, pending, role, inviteToken, deleted, playMove, moves, lastMove, feedback } = useGameState(
    gameId,
    inviteTokenFromUrl,
  );
  useMoveSound(feedback.event, feedback.seq);
  useTabTitle(game ? gameTitle(game, role) : BASE_TITLE, feedback.attentionSeq);
  // Zuschauer wählen die Ansicht selbst; sie wird nicht gespeichert.
  const [spectatorFlipped, setSpectatorFlipped] = useState(false);
  const view = game
    ? deriveGameView({ game, role, pending, deleted, spectatorFlipped, feedbackEvent: feedback.event })
    : null;

  const inviteLink = inviteToken ? `${location.origin}/game/${gameId}?invite=${inviteToken}` : null;
  const spectatorLink = `${location.origin}/game/${gameId}`;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground underline">
          ← Meine Partien
        </Link>
        <SoundToggle />
      </div>
      {loading && <p className="text-muted-foreground">Lade Brett…</p>}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {game && view && (
          // `--board-size`: Brett und Spielerzeilen teilen sich die Breite. 11rem ist der Platz für
          // Kopfzeile, zwei Spielerzeilen und Abstände, den das Brett von 100dvh abzieht.
          <div
            data-board-column
            className="flex min-w-0 flex-col gap-2"
            // Bei beendeter Partie zieht das Brett zusätzlich die Höhe des Ergebnisbanners ab, damit es sichtbar bleibt.
            style={{ '--board-size': `clamp(280px, min(100%, calc(100dvh - ${view.over ? '17rem' : '11rem'})), 720px)` } as React.CSSProperties}
          >
            <div className="w-[var(--board-size)] max-w-full">
              <PlayerRow {...view.top} />
            </div>
            <Chessboard
              board={game.board}
              sideToMove={game.sideToMove}
              onMove={playMove}
              disabled={view.boardDisabled}
              orientation={view.orientation}
              lastMove={lastMove}
              kingMarker={view.kingMarker}
              animateCheck={view.animateCheck}
              ended={view.over}
            />
            <div data-turn-indicator={view.turnIndicator} className="w-[var(--board-size)] max-w-full">
              <PlayerRow {...view.bottom} />
            </div>
            <div className="w-[var(--board-size)] max-w-full">
              <GameResultBanner status={game.status} endReason={game.endReason} role={role} />
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
          {game && role === null && (
            <Button variant="outline" onClick={() => setSpectatorFlipped((f) => !f)}>
              <RefreshCw /> Brett drehen
            </Button>
          )}
        </aside>
      </div>
    </main>
  );
}

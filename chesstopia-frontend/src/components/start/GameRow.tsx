import { Link } from 'react-router';
import { Trash2, X } from 'lucide-react';
import type { GameResponse } from '@chesstopia/openapi-client';
import type { GameRole } from '@/lib/gameStorage';
import { formatEndedAt, formatLastPlayed } from '@/lib/lastPlayed';
import { outcomeBadge, outcomeKind, type OutcomeKind } from '@/lib/outcome';
import { sideOf, type Side } from '@/lib/position';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GameRowProps {
  gameId: string;
  role: GameRole;
  /** `null`, wenn die Partie nicht mehr abrufbar ist. */
  game: GameResponse | null;
  now: Date;
  /** Löschen läuft gerade irgendwo in der Liste. */
  disabled?: boolean;
  error?: string;
  onDelete: () => void;
  onRemove: () => void;
}

const OUTCOME_CLASS: Record<OutcomeKind, string> = {
  won: 'border-green-200 bg-green-100 text-green-800',
  lost: 'border-red-200 bg-red-100 text-red-800',
  draw: '',
};

export function GameRow({ gameId, role, game, now, disabled = false, error, onDelete, onRemove }: GameRowProps) {
  const invited = role === 'INVITED';
  const side: Side = invited ? 'b' : 'w';
  const ongoing = game?.status === 'ONGOING';
  const myTurn = game !== null && ongoing && sideOf(game.position) === side;

  const badge = game === null ? null : ongoing ? (myTurn ? 'Du bist am Zug' : 'Gegner am Zug') : outcomeBadge(game.status, game.endReason, side);
  const outcome = game === null ? null : outcomeKind(game.status, side);
  const openLabel = ongoing ? (myTurn ? 'Fortsetzen' : 'Öffnen') : 'Ansehen';

  const IconAction = invited ? X : Trash2;
  const actionLabel = invited ? 'Aus Liste entfernen' : 'Partie löschen';

  return (
    <li
      data-game-id={gameId}
      data-section={ongoing ? 'laufend' : 'beendet'}
      data-color={side}
      data-invited={invited ? 'true' : 'false'}
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-card px-3.5 py-3 text-card-foreground',
        !ongoing && 'bg-muted/40',
        game === null && 'text-muted-foreground',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-3.5 shrink-0 rounded-full border border-foreground/40', side === 'w' ? 'bg-white' : 'bg-neutral-800')}
      />
      {/* Mindestbreite für den Text: Auf schmalen Bildschirmen rutschen Badge und
          Knöpfe in eine eigene, rechtsbündige Zeile, statt den Text zu zerquetschen. */}
      <div className="min-w-0 flex-1 basis-48">
        <div className="text-sm font-medium">
          {game === null ? 'Partie nicht mehr verfügbar' : `Du spielst ${side === 'w' ? 'Weiß' : 'Schwarz'}${invited ? ' · eingeladen' : ''}`}
        </div>
        {game !== null && (
          <div data-last-played={game.lastActivityAt} className="mt-0.5 text-xs text-muted-foreground">
            {ongoing ? `zuletzt gespielt ${formatLastPlayed(game.lastActivityAt, now)}` : formatEndedAt(game.lastActivityAt, now)}
          </div>
        )}
        {error && <div className="mt-0.5 text-xs text-destructive">Fehler: {error}</div>}
      </div>
      {badge && (
        <Badge
          data-status-badge
          data-outcome={outcome ?? undefined}
          variant={myTurn ? 'default' : 'outline'}
          className={cn('ml-auto whitespace-nowrap', outcome && OUTCOME_CLASS[outcome])}
        >
          {badge}
        </Badge>
      )}
      {game !== null && (
        <Button asChild size="sm" variant={myTurn ? 'default' : 'outline'}>
          <Link to={`/game/${gameId}`}>{openLabel}</Link>
        </Button>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={actionLabel}
            disabled={disabled}
            onClick={invited ? onRemove : onDelete}
          >
            <IconAction />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{actionLabel}</TooltipContent>
      </Tooltip>
    </li>
  );
}

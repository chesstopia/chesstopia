import type { Side } from '@/lib/position';
import { cn } from '@/lib/utils';

interface PlayerRowProps {
  side: Side;
  label: string;
  active: boolean;
  note?: string;
}

export function PlayerRow({ side, label, active, note }: PlayerRowProps) {
  return (
    <div
      data-testid="player-row"
      data-active={active ? 'true' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
        active ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground ring-1 ring-foreground/10',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-3 rounded-full border border-foreground/40', side === 'w' ? 'bg-white' : 'bg-black')}
      />
      <span className="font-medium">{label}</span>
      {note && <span className="ml-auto opacity-70">{note}</span>}
    </div>
  );
}

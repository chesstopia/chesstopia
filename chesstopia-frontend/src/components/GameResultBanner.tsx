import type { GameResponse } from '@chesstopia/openapi-client';
import { Alert } from '@/components/ui/alert';
import { neutralResult, outcomeKind, ownResult } from '@/lib/outcome';
import { cn } from '@/lib/utils';
import type { Side } from '@/lib/position';

type Props = {
  status: GameResponse['status'];
  endReason: GameResponse['endReason'] | null | undefined;
  /** Eigene Seite; `null` für Zuschauer, die keine eigene Sicht bekommen. */
  role?: Side | null;
};

/**
 * Das Partieende in zwei Ebenen: groß die eigene Sicht, darunter die neutrale
 * Zeile. Nur die neutrale Zeile trägt `role="status"` und `data-game-result` —
 * das Partieende ist eine Zustandsänderung, die eine Ansage verdient, und der
 * E2E-Korpus prüft genau diesen Text. `Alert` setzt von sich aus `role="alert"`;
 * das wird hier ausdrücklich auf `status` überschrieben, damit nichts doppelt
 * angesagt wird.
 */
/** Gold für den Sieg, ruhiges Schiefergrau für die Niederlage — kein Rot —, neutral für Remis. */
const OUTCOME_STYLE = {
  won: 'border-transparent bg-gradient-to-r from-amber-300 to-amber-500 text-amber-950',
  lost: 'border-transparent bg-slate-700 text-slate-50',
  draw: 'border-stone-300 bg-stone-100 text-stone-800',
} as const;

export function GameResultBanner({ status, endReason, role = null }: Props) {
  const text = neutralResult(status, endReason);
  if (text === null) return null;
  const own = ownResult(status, role);
  // Zuschauer bekommen die neutrale Fassung — für sie gibt es weder Sieg noch Niederlage.
  const outcome = role === null ? 'draw' : (outcomeKind(status, role) ?? 'draw');
  return (
    <Alert role="presentation" data-outcome={outcome} className={cn('gap-1 text-center', OUTCOME_STYLE[outcome])}>
      {own && <p className="text-xl font-semibold">{own}</p>}
      <p role="status" data-game-result className="opacity-85">
        {text}
      </p>
    </Alert>
  );
}

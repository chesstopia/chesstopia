import type { GameResponse } from '@chesstopia/openapi-client';

type Props = {
  status: GameResponse['status'];
  endReason: GameResponse['endReason'] | null | undefined;
};

const OUTCOME: Record<string, string> = {
  WHITE_WON: 'Schachmatt — Weiß gewinnt',
  BLACK_WON: 'Schachmatt — Schwarz gewinnt',
  DRAW: 'Remis',
};

const REASON: Record<string, string> = {
  STALEMATE: 'Patt',
  FIFTY_MOVE_RULE: '50-Züge-Regel',
  INSUFFICIENT_MATERIAL: 'ungenügendes Material',
  THREEFOLD_REPETITION: 'dreifache Stellungswiederholung',
};

/**
 * Die Ergebniszeile einer beendeten Partie. `role="status"` bewusst gesetzt —
 * das Partieende ist eine Zustandsänderung, die eine Ansage verdient (SKILL.md:
 * „wer eine Rolle braucht, ändert die Komponente absichtlich und begründet").
 */
export function GameResultBanner({ status, endReason }: Props) {
  if (status === 'ONGOING') return null;
  const base = OUTCOME[status] ?? 'Partie beendet';
  const detail = status === 'DRAW' && endReason && REASON[endReason] ? ` (${REASON[endReason]})` : '';
  return (
    <p role="status" className="text-lg font-medium text-stone-200">
      {base}
      {detail}
    </p>
  );
}

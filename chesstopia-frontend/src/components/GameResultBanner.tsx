import type { GameResponse } from '@chesstopia/openapi-client';
import { neutralResult } from '@/lib/outcome';

type Props = {
  status: GameResponse['status'];
  endReason: GameResponse['endReason'] | null | undefined;
};

/**
 * Die Ergebniszeile einer beendeten Partie. `role="status"` bewusst gesetzt —
 * das Partieende ist eine Zustandsänderung, die eine Ansage verdient (SKILL.md:
 * „wer eine Rolle braucht, ändert die Komponente absichtlich und begründet").
 */
export function GameResultBanner({ status, endReason }: Props) {
  const text = neutralResult(status, endReason);
  if (text === null) return null;
  return (
    <p role="status" className="text-lg font-medium text-stone-200">
      {text}
    </p>
  );
}

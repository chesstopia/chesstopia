import type { GameResponse } from '@chesstopia/openapi-client';
import { Alert } from '@/components/ui/alert';
import { neutralResult, ownResult } from '@/lib/outcome';
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
export function GameResultBanner({ status, endReason, role = null }: Props) {
  const text = neutralResult(status, endReason);
  if (text === null) return null;
  const own = ownResult(status, role);
  return (
    <Alert role="presentation" className="gap-1">
      {own && <p className="text-xl font-semibold">{own}</p>}
      <p role="status" data-game-result className="text-muted-foreground">
        {text}
      </p>
    </Alert>
  );
}

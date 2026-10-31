import type { GameResponse } from '@chesstopia/openapi-client';
import type { Side } from '@/lib/position';

type Status = GameResponse['status'];
type EndReason = GameResponse['endReason'] | null | undefined;

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

/** Ergebnistext ohne Perspektive; `null`, solange die Partie läuft. */
export function neutralResult(status: Status, endReason: EndReason): string | null {
  if (status === 'ONGOING') return null;
  const base = OUTCOME[status] ?? 'Partie beendet';
  const detail = status === 'DRAW' && endReason && REASON[endReason] ? ` (${REASON[endReason]})` : '';
  return base + detail;
}

export type OutcomeKind = 'won' | 'lost' | 'draw';

function assertNever(status: never): never {
  throw new Error(`Unbekannter Partiestatus: ${String(status)}`);
}

/** Ausgang aus Sicht von `side`; `null`, solange die Partie läuft. */
export function outcomeKind(status: Status, side: Side): OutcomeKind | null {
  switch (status) {
    case 'ONGOING':
      return null;
    case 'DRAW':
      return 'draw';
    case 'WHITE_WON':
      return side === 'w' ? 'won' : 'lost';
    case 'BLACK_WON':
      return side === 'b' ? 'won' : 'lost';
    default:
      return assertNever(status);
  }
}

const OWN_RESULT = { won: 'Du hast gewonnen', lost: 'Du hast verloren', draw: 'Remis' } as const;

/** Ergebnis aus Sicht des eigenen Spielers; `null` bei laufender Partie und für Zuschauer. */
export function ownResult(status: Status, role: Side | null): 'Du hast gewonnen' | 'Du hast verloren' | 'Remis' | null {
  if (role === null) return null;
  const kind = outcomeKind(status, role);
  return kind === null ? null : OWN_RESULT[kind];
}

/** Kurzfassung für Listen, z. B. „Gewonnen · Schachmatt“. */
export function outcomeBadge(status: Status, endReason: EndReason, side: Side): string {
  const kind = outcomeKind(status, side);
  if (kind === null) return 'Läuft';
  if (kind === 'draw') {
    return endReason && REASON[endReason] ? `Remis · ${REASON[endReason]}` : 'Remis';
  }
  return `${kind === 'won' ? 'Gewonnen' : 'Verloren'} · Schachmatt`;
}

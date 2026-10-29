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

/** Ergebnis aus Sicht des eigenen Spielers; `null` bei laufender Partie und für Zuschauer. */
export function ownResult(status: Status, role: Side | null): 'Du hast gewonnen' | 'Du hast verloren' | 'Remis' | null {
  if (status === 'ONGOING' || role === null) return null;
  if (status === 'DRAW') return 'Remis';
  const winner: Side = status === 'WHITE_WON' ? 'w' : 'b';
  return winner === role ? 'Du hast gewonnen' : 'Du hast verloren';
}

/** Kurzfassung für Listen, z. B. „Gewonnen · Schachmatt“. */
export function outcomeBadge(status: Status, endReason: EndReason, side: Side): string {
  if (status === 'DRAW') {
    return endReason && REASON[endReason] ? `Remis · ${REASON[endReason]}` : 'Remis';
  }
  const winner: Side = status === 'WHITE_WON' ? 'w' : 'b';
  return `${winner === side ? 'Gewonnen' : 'Verloren'} · Schachmatt`;
}

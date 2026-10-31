import type { MoveRecord } from '@chesstopia/openapi-client';
import { formatSquare } from '@/lib/position';

const PROMOTION_LETTER: Record<string, string> = { QUEEN: 'D', ROOK: 'T', BISHOP: 'L', KNIGHT: 'S' };

/** `e2–e4`, bei Umwandlung `e7–e8=D` (Gedankenstrich U+2013, deutsche Figurenbuchstaben). */
export function formatMove(record: MoveRecord): string {
  const { from, to, promotion } = record.move;
  const suffix = promotion ? `=${PROMOTION_LETTER[promotion]}` : '';
  return `${formatSquare(from)}–${formatSquare(to)}${suffix}`;
}

/** Gruppiert die Zugfolge zu Zeilen „Nummer · Weiß · Schwarz“. */
export function pairMoves(records: MoveRecord[]): { number: number; white: MoveRecord; black?: MoveRecord }[] {
  const rows: { number: number; white: MoveRecord; black?: MoveRecord }[] = [];
  for (let i = 0; i < records.length; i += 2) {
    rows.push({ number: i / 2 + 1, white: records[i], black: records[i + 1] });
  }
  return rows;
}

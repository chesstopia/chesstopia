import type { PieceCode } from '@/lib/position';

const SYMBOLS: Record<PieceCode, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

type PieceProps = {
  code: PieceCode;
  /** Die Figur hängt am Zeiger — ihr Feld zeigt sie nur noch blass. */
  dragging?: boolean;
};

export function Piece({ code, dragging = false }: PieceProps) {
  return (
    <span
      className={`text-4xl leading-none select-none drop-shadow-sm ${
        dragging ? 'opacity-30' : ''
      }`}
    >
      {SYMBOLS[code]}
    </span>
  );
}

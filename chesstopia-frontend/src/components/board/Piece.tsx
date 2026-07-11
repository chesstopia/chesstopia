import type { PieceCode } from '@/lib/fen';

const SYMBOLS: Record<PieceCode, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

export function Piece({ code }: { code: PieceCode }) {
  return (
    <span className="text-4xl leading-none select-none drop-shadow-sm">
      {SYMBOLS[code]}
    </span>
  );
}

import type { PieceCode } from '@/lib/fen';
import { Piece } from './Piece';

type SquareProps = {
  light: boolean;
  piece: PieceCode | null;
};

export function Square({ light, piece }: SquareProps) {
  return (
    <div
      className={`flex items-center justify-center w-full aspect-square ${
        light ? 'bg-amber-100' : 'bg-amber-800'
      }`}
    >
      {piece && <Piece code={piece} />}
    </div>
  );
}

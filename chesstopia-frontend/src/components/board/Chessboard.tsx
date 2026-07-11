import type { Board } from '@/lib/fen';
import { Square } from './Square';

type ChessboardProps = {
  board: Board;
};

export function Chessboard({ board }: ChessboardProps) {

  return (
    <div className="grid grid-cols-8 w-[min(90vw,560px)] aspect-square border-2 border-stone-700 shadow-xl">
      {board.flatMap((rank, rankIdx) =>
        rank.map((piece, fileIdx) => (
          <Square
            key={`${rankIdx}-${fileIdx}`}
            light={(rankIdx + fileIdx) % 2 === 0}
            piece={piece}
          />
        ))
      )}
    </div>
  );
}

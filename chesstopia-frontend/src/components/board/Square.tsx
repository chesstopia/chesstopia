import type { PieceCode } from '@/lib/fen';
import { Piece } from './Piece';

type SquareProps = {
  square: string;
  light: boolean;
  piece: PieceCode | null;
  /** Nur eine greifbare Figur startet einen Zug. */
  draggable: boolean;
  dragging: boolean;
  hovered: boolean;
  onPickUp: (square: string, x: number, y: number) => void;
  onHover: (square: string) => void;
  onDrop: (square: string) => void;
};

export function Square({
  square, light, piece, draggable, dragging, hovered, onPickUp, onHover, onDrop,
}: SquareProps) {
  const base = light ? 'bg-amber-100' : 'bg-amber-800';
  const mark = dragging ? 'ring-4 ring-inset ring-sky-400' : hovered ? 'ring-4 ring-inset ring-sky-200' : '';

  return (
    <div
      // Der Feldname ist zugleich die Beschriftung — ein Brett ohne sie ist für
      // eine Vorlesehilfe 64 leere Kästen.
      aria-label={square}
      data-square={square}
      className={`flex items-center justify-center w-full aspect-square ${base} ${mark} ${
        draggable ? 'cursor-grab' : ''
      }`}
      // Ohne diese Zeile scrollt der Browser auf einem Tablet das Brett weg,
      // statt die Figur zu ziehen.
      style={{ touchAction: 'none' }}
      onPointerDown={(event) => {
        if (!draggable) return;
        event.preventDefault();
        onPickUp(square, event.clientX, event.clientY);
      }}
      onPointerEnter={() => onHover(square)}
      onPointerUp={() => onDrop(square)}
    >
      {piece && <Piece code={piece} dragging={dragging} />}
    </div>
  );
}

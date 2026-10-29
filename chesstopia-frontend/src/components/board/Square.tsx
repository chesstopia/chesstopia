import type { PieceCode } from '@/lib/position';
import { Piece } from './Piece';
import { useBoardTheme } from './theme/BoardThemeProvider';

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
  const { colors } = useBoardTheme();
  const ring = dragging ? colors.dragSource : hovered ? colors.dragTarget : null;

  return (
    <div
      // Der Feldname ist zugleich die Beschriftung — ein Brett ohne sie ist für
      // eine Vorlesehilfe 64 leere Kästen.
      aria-label={square}
      data-square={square}
      className={`flex items-center justify-center w-full aspect-square ${
        draggable ? 'cursor-grab' : ''
      }`}
      // Ohne diese Zeile scrollt der Browser auf einem Tablet das Brett weg,
      // statt die Figur zu ziehen.
      style={{
        touchAction: 'none',
        backgroundColor: light ? colors.lightSquare : colors.darkSquare,
        boxShadow: ring ? `inset 0 0 0 4px ${ring}` : undefined,
      }}
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

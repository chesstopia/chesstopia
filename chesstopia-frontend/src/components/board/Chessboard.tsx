import { useEffect, useState } from 'react';
import type { Board, Side } from '@/lib/fen';
import { fromSquare, toSquare } from '@/lib/squares';
import { Piece } from './Piece';
import { Square } from './Square';

type ChessboardProps = {
  board: Board;
  sideToMove?: Side;
  onMove?: (from: string, to: string) => void;
  disabled?: boolean;
};

type Drag = { from: string; x: number; y: number };

/**
 * Das Brett und die Zeigergeste darauf.
 *
 * Bewusst über Pointer-Events statt über die HTML5-Drag-API: Letztere lässt
 * sich unter jsdom nicht durchspielen, und ADR-0019 macht Ebene 2 für jede
 * zustandstragende Komponente zur Pflicht. Pointer-Events decken zudem Maus
 * und Touch mit einem Pfad ab.
 *
 * Kein `setPointerCapture` — jsdom kennt es nicht, und das Zielfeld meldet sich
 * ohnehin selbst.
 */
export function Chessboard({ board, sideToMove = 'w', onMove, disabled = false }: ChessboardProps) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Loslassen außerhalb des Bretts bricht ab — sonst klebt die Figur am Zeiger,
  // bis jemand zufällig wieder auf ein Feld klickt.
  useEffect(() => {
    if (drag === null) return;
    const cancel = () => {
      setDrag(null);
      setHovered(null);
    };
    window.addEventListener('pointerup', cancel);
    return () => window.removeEventListener('pointerup', cancel);
  }, [drag]);

  const handleDrop = (square: string) => {
    if (drag !== null && drag.from !== square) onMove?.(drag.from, square);
    setDrag(null);
    setHovered(null);
  };

  return (
    <div
      className="relative grid grid-cols-8 w-[min(90vw,560px)] aspect-square border-2 border-stone-700 shadow-xl"
      onPointerMove={(event) =>
        setDrag((current) =>
          current === null ? null : { ...current, x: event.clientX, y: event.clientY },
        )
      }
    >
      {board.flatMap((rank, rankIdx) =>
        rank.map((piece, fileIdx) => {
          const square = toSquare(rankIdx, fileIdx);
          return (
            <Square
              key={square}
              square={square}
              light={(rankIdx + fileIdx) % 2 === 0}
              piece={piece}
              draggable={!disabled && piece !== null && piece[0] === sideToMove}
              dragging={drag?.from === square}
              hovered={drag !== null && hovered === square}
              onPickUp={(from, x, y) => setDrag({ from, x, y })}
              onHover={setHovered}
              onDrop={handleDrop}
            />
          );
        }),
      )}

      {drag !== null && <GhostPiece board={board} drag={drag} />}
    </div>
  );
}

/**
 * Die Figur am Zeiger. `pointer-events: none` ist hier nicht Kosmetik: Ohne
 * sie fängt das Geisterbild jedes `pointerup` ab und kein Feld erfährt je,
 * dass auf ihm abgelegt wurde.
 */
function GhostPiece({ board, drag }: { board: Board; drag: Drag }) {
  const { rankIdx, fileIdx } = fromSquare(drag.from);
  const piece = board[rankIdx]?.[fileIdx];
  if (!piece) return null;

  return (
    <span
      aria-hidden
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
      style={{ left: drag.x, top: drag.y }}
    >
      <Piece code={piece} />
    </span>
  );
}

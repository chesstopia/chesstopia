import { useEffect, useState } from 'react';
import type { Board, Side } from '@/lib/position';
import { fromSquare, toSquare } from '@/lib/squares';
import { Piece } from './Piece';
import { Square } from './Square';
import { useBoardTheme } from './theme/BoardThemeProvider';

/** Der König, der einen Rahmen bekommt: im Schach oder mattgesetzt. */
export type KingMarker = { square: string; kind: 'check' | 'mate' };

type ChessboardProps = {
  board: Board;
  sideToMove?: Side;
  onMove?: (from: string, to: string) => void;
  disabled?: boolean;
  /** Aus wessen Sicht das Brett steht; Schwarz sieht es um 180° gedreht. */
  orientation?: Side;
  lastMove?: { from: string; to: string } | null;
  kingMarker?: KingMarker | null;
  /** Der markierte König wackelt einmal (nur beim Eintreffen des Schachs). */
  animateCheck?: boolean;
  /** Beendete Partie: das Brett wird nach dem Theme gedämpft. */
  ended?: boolean;
};

/** `size` ist die Feldkante in px, gemessen beim Aufnehmen. */
type Drag = { from: string; x: number; y: number; size: number };

const FILES = 'abcdefgh';

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
export function Chessboard({
  board, sideToMove = 'w', onMove, disabled = false, orientation = 'w', lastMove = null,
  kingMarker = null, animateCheck = false, ended = false,
}: ChessboardProps) {
  const theme = useBoardTheme();
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

  // Gedreht wird nur die Anzeigereihenfolge; Feldnamen und Brettindizes bleiben echt.
  const flipped = orientation === 'b';
  const rankOrder = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const fileOrder = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div
      className="relative grid grid-cols-8 aspect-square border-2 border-stone-700 shadow-xl"
      // `--board-size` setzt die Partieseite; ohne sie füllt das Brett seine Spalte.
      style={{
        width: 'var(--board-size, 100%)',
        ...(ended ? { opacity: theme.ended.opacity, filter: `saturate(${theme.ended.saturate})` } : {}),
      }}
      onPointerMove={(event) =>
        setDrag((current) =>
          current === null ? null : { ...current, x: event.clientX, y: event.clientY },
        )
      }
    >
      {rankOrder.flatMap((rankIdx, row) =>
        fileOrder.map((fileIdx, col) => {
          const square = toSquare(rankIdx, fileIdx);
          const piece = board[rankIdx]?.[fileIdx] ?? null;
          return (
            <Square
              key={square}
              square={square}
              light={(rankIdx + fileIdx) % 2 === 0}
              piece={piece}
              lastMove={lastMove !== null && (lastMove.from === square || lastMove.to === square)}
              marker={kingMarker?.square === square ? kingMarker.kind : null}
              animate={animateCheck && kingMarker?.square === square}
              fileLabel={row === 7 ? FILES[fileIdx] : undefined}
              rankLabel={col === 0 ? String(8 - rankIdx) : undefined}
              draggable={!disabled && piece !== null && piece[0] === sideToMove}
              dragging={drag?.from === square}
              hovered={drag !== null && hovered === square}
              onPickUp={(from, x, y, size) => setDrag({ from, x, y, size })}
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
      <Piece code={piece} size={drag.size * 0.9} />
    </span>
  );
}

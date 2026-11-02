import { useEffect, useRef, useState } from 'react';
import type { PendingPromotion } from '@/lib/gameModel';
import type { Promotion } from '@/lib/moveRequest';
import type { Board, KingMarker, PieceCode, Side } from '@/lib/position';
import { FILES, fromSquare, toSquare } from '@/lib/squares';
import { Piece } from './Piece';
import { PromotionPicker } from './PromotionPicker';
import { Square } from './Square';
import { useBoardTheme } from './theme/BoardThemeProvider';

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
  /** Offene Umwandlung: Auswahl am Zielfeld, Vorschau, übriges Brett abgedunkelt und gesperrt. */
  promotion?: PendingPromotion | null;
  onPromote?: (piece: Promotion) => void;
  onCancelPromotion?: () => void;
};

const PROMOTION_LETTER: Record<Promotion, string> = { QUEEN: 'Q', ROOK: 'R', BISHOP: 'B', KNIGHT: 'N' };

/** `size` ist die Feldkante in px, gemessen beim Aufnehmen. */
type Drag = { from: string; x: number; y: number; size: number };

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
  kingMarker = null, animateCheck = false, ended = false, promotion = null, onPromote, onCancelPromotion,
}: ChessboardProps) {
  const theme = useBoardTheme();
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Die angewählte Figur ist reine Anzeige und startet bei jedem Öffnen mit der
  // Dame. Zurückgesetzt wird beim Rendern statt im Effekt
  // (`react-hooks/set-state-in-effect`): Ändert sich die offene Umwandlung,
  // gilt wieder die Dame.
  const promotionKey = promotion === null ? null : `${promotion.from}-${promotion.to}`;
  const [choice, setChoice] = useState<Promotion>('QUEEN');
  const [choiceKey, setChoiceKey] = useState<string | null>(promotionKey);
  if (choiceKey !== promotionKey) {
    setChoiceKey(promotionKey);
    setChoice('QUEEN');
  }

  // Ein Zeigerdruck irgendwo außerhalb der Spalte bricht ab — auf dem Brett wie daneben.
  const pickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (promotionKey === null) return;
    const cancel = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      onCancelPromotion?.();
    };
    document.addEventListener('pointerdown', cancel);
    return () => document.removeEventListener('pointerdown', cancel);
  }, [promotionKey, onCancelPromotion]);

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

  const promo = promotion === null ? null : promotionLayout(board, promotion, choice, rankOrder, fileOrder);

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
          const piece = promo !== null && square === promotion?.from ? null : (board[rankIdx]?.[fileIdx] ?? null);
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
              draggable={promo === null && !disabled && piece !== null && piece[0] === sideToMove}
              preview={promo !== null && square === promotion?.to ? promo.preview : null}
              dimmed={promo !== null && square !== promotion?.to}
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

      {promo !== null && (
        <div
          ref={pickerRef}
          className="absolute z-20"
          style={{
            left: `${promo.col * 12.5}%`,
            width: '12.5%',
            ...(promo.direction === 'down'
              ? { top: `${(promo.row + 1) * 12.5}%` }
              : { bottom: `${(8 - promo.row) * 12.5}%` }),
          }}
        >
          <PromotionPicker
            side={promo.side}
            selected={choice}
            direction={promo.direction}
            onSelect={setChoice}
            onConfirm={() => onPromote?.(choice)}
            onCancel={() => onCancelPromotion?.()}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Wo die Auswahl sitzt: Anzeigespalte und -zeile des Zielfelds, und dass sie
 * immer zur Brettmitte hin aufklappt — sechs Felder hoch, von acht.
 */
function promotionLayout(
  board: Board,
  promotion: PendingPromotion,
  choice: Promotion,
  rankOrder: number[],
  fileOrder: number[],
) {
  const origin = fromSquare(promotion.from);
  const target = fromSquare(promotion.to);
  const side = (board[origin.rankIdx]?.[origin.fileIdx]?.[0] ?? 'w') as Side;
  const row = rankOrder.indexOf(target.rankIdx);
  return {
    side,
    row,
    col: fileOrder.indexOf(target.fileIdx),
    direction: (row < 4 ? 'down' : 'up') as 'down' | 'up',
    preview: `${side}${PROMOTION_LETTER[choice]}` as PieceCode,
  };
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

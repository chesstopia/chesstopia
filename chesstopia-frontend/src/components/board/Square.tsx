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
  lastMove: boolean;
  /** Rahmen am König im Schach bzw. im Matt. */
  marker: 'check' | 'mate' | null;
  /** Der König wackelt einmal — nur beim Eintreffen des Schachs. */
  animate: boolean;
  /** Liniebuchstabe bzw. Reihenziffer; nur Randfelder tragen eine. */
  fileLabel?: string;
  rankLabel?: string;
  /** `size` ist die gemessene Feldkante, damit das Geisterbild gleich groß wird. */
  onPickUp: (square: string, x: number, y: number, size: number) => void;
  onHover: (square: string) => void;
  onDrop: (square: string) => void;
};

export function Square({
  square, light, piece, draggable, dragging, hovered, lastMove, marker, animate, fileLabel, rankLabel, onPickUp, onHover, onDrop,
}: SquareProps) {
  const { colors, markers } = useBoardTheme();
  // Beschriftung in der Gegenfarbe des Feldes, damit sie auf beiden lesbar bleibt.
  const labelColor = light ? colors.darkSquare : colors.lightSquare;
  const ring = dragging ? colors.dragSource : hovered ? colors.dragTarget : null;
  // Der Drag-Ring gewinnt: Wer den König im Schach greift, soll sehen, was er hält.
  const markerStyle = marker === null ? null : markers[marker];
  const boxShadow = ring
    ? `inset 0 0 0 4px ${ring}`
    : markerStyle
      ? `inset 0 0 0 ${markerStyle.width} ${markerStyle.color}`
      : undefined;

  return (
    <div
      // Der Feldname ist zugleich die Beschriftung — ein Brett ohne sie ist für
      // eine Vorlesehilfe 64 leere Kästen.
      aria-label={square}
      data-square={square}
      data-last-move={lastMove || undefined}
      data-check={marker ?? undefined}
      className={`relative flex items-center justify-center w-full aspect-square ${
        draggable ? 'cursor-grab' : ''
      }`}
      // Ohne diese Zeile scrollt der Browser auf einem Tablet das Brett weg,
      // statt die Figur zu ziehen.
      style={{
        touchAction: 'none',
        backgroundColor: light ? colors.lightSquare : colors.darkSquare,
        // Als Hintergrundebene statt Overlay: so liegt die Markierung sicher unter der Figur.
        backgroundImage: lastMove
          ? `linear-gradient(${colors.lastMove}, ${colors.lastMove})`
          : undefined,
        boxShadow,
      }}
      onPointerDown={(event) => {
        if (!draggable) return;
        event.preventDefault();
        onPickUp(square, event.clientX, event.clientY, event.currentTarget.getBoundingClientRect().width);
      }}
      onPointerEnter={() => onHover(square)}
      onPointerUp={() => onDrop(square)}
    >
      {rankLabel && (
        <span
          aria-hidden
          data-coord-rank
          className="absolute left-0.5 top-0 text-[10px] leading-none font-semibold select-none pointer-events-none"
          style={{ color: labelColor }}
        >
          {rankLabel}
        </span>
      )}
      {fileLabel && (
        <span
          aria-hidden
          data-coord-file
          className="absolute right-0.5 bottom-0.5 text-[10px] leading-none font-semibold select-none pointer-events-none"
          style={{ color: labelColor }}
        >
          {fileLabel}
        </span>
      )}
      {piece &&
        (animate ? (
          <span className="motion-safe:animate-king-wiggle inline-flex">
            <Piece code={piece} dragging={dragging} />
          </span>
        ) : (
          <Piece code={piece} dragging={dragging} />
        ))}
    </div>
  );
}

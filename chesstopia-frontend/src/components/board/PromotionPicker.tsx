import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { PROMOTIONS } from '@/lib/moveRequest';
import type { Promotion } from '@/lib/moveRequest';
import type { PieceCode, Side } from '@/lib/position';
import { useBoardTheme } from './theme/BoardThemeProvider';

const LETTER: Record<Promotion, string> = { QUEEN: 'Q', ROOK: 'R', BISHOP: 'B', KNIGHT: 'N' };
const LABEL: Record<Promotion, string> = { QUEEN: 'Dame', ROOK: 'Turm', BISHOP: 'Läufer', KNIGHT: 'Springer' };

type PromotionPickerProps = {
  side: Side;
  selected: Promotion;
  /**
   * Wohin die Spalte vom Zielfeld aus wächst. Bei `up` steht die Dame unten am
   * Zielfeld; die DOM-Reihenfolge bleibt dieselbe, nur die Anzeige dreht sich.
   */
  direction?: 'down' | 'up';
  onSelect: (piece: Promotion) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Die Spalte zur Wahl der Umwandlungsfigur: vier Figuren, ✓ und ✗.
 * Positioniert wird sie vom Aufrufer; sie füllt dessen Breite.
 */
export function PromotionPicker({
  side, selected, direction = 'down', onSelect, onConfirm, onCancel,
}: PromotionPickerProps) {
  const theme = useBoardTheme();
  const buttons = useRef<Partial<Record<Promotion, HTMLButtonElement | null>>>({});

  // Der Fokus folgt der Auswahl — so bleibt Enter immer bei der sichtbaren Wahl.
  useEffect(() => {
    buttons.current[selected]?.focus();
  }, [selected]);

  const step = (delta: number) => {
    const next = PROMOTIONS[PROMOTIONS.indexOf(selected) + delta];
    if (next !== undefined) onSelect(next);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    // Bei `up` liegt die Spaltenreihenfolge auf dem Kopf: ↑ entfernt sich dann vom Zielfeld.
    const away = direction === 'down' ? 'ArrowDown' : 'ArrowUp';
    const toward = direction === 'down' ? 'ArrowUp' : 'ArrowDown';
    if (event.key === away) step(1);
    else if (event.key === toward) step(-1);
    // Enter bestätigt nur auf der angewählten Figur. Auf ✓, ✗ und einer anderen
    // Figur gilt der eigene Klick des Knopfes — sonst schickte Enter auf ✗ den Zug ab.
    else if (event.key === 'Enter' && event.target === buttons.current[selected]) onConfirm();
    else if (event.key === 'Escape') onCancel();
    else return;
    event.preventDefault();
  };

  const cell = 'flex w-full aspect-square items-center justify-center';

  return (
    <div
      role="dialog"
      aria-label="Umwandlung wählen"
      data-promotion-picker
      data-direction={direction}
      className={`flex w-full overflow-hidden rounded-md bg-white shadow-xl ${
        direction === 'down' ? 'flex-col' : 'flex-col-reverse'
      }`}
      onKeyDown={onKeyDown}
    >
      {PROMOTIONS.map((piece) => {
        const code = `${side}${LETTER[piece]}` as PieceCode;
        const active = piece === selected;
        return (
          <button
            key={piece}
            type="button"
            ref={(el) => {
              buttons.current[piece] = el;
            }}
            aria-label={LABEL[piece]}
            aria-pressed={active}
            data-promotion-choice={piece}
            className={`${cell} outline-none`}
            style={active ? { backgroundColor: theme.colors.promotionSelected } : undefined}
            onClick={() => onSelect(piece)}
          >
            <img src={theme.pieces[code]} alt="" draggable={false} className="w-[85%] h-auto select-none" />
          </button>
        );
      })}
      <button
        type="button"
        aria-label="Umwandlung bestätigen"
        data-promotion-confirm
        className={`${cell} bg-green-600 text-xl font-bold text-white`}
        onClick={onConfirm}
      >
        ✓
      </button>
      <button
        type="button"
        aria-label="Umwandlung abbrechen"
        data-promotion-cancel
        className={`${cell} bg-stone-200 text-lg text-stone-700`}
        onClick={onCancel}
      >
        ✕
      </button>
    </div>
  );
}

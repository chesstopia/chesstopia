import type { PieceCode } from '@/lib/position';
import { useBoardTheme } from './theme/BoardThemeProvider';

const COLOR_NAME = { w: 'weißer', b: 'schwarzer' } as const;
const TYPE_NAME = {
  K: 'König', Q: 'Dame', R: 'Turm', B: 'Läufer', N: 'Springer', P: 'Bauer',
} as const;

type PieceProps = {
  code: PieceCode;
  /** Die Figur hängt am Zeiger — ihr Feld zeigt sie nur noch blass. */
  dragging?: boolean;
  /** Kantenlänge in px; ohne Angabe füllt die Figur ~90 % ihres Feldes. */
  size?: number;
  /**
   * Vorschau der Umwandlungsfigur: halb durchsichtig und bewusst ohne
   * `data-piece` — sie steht noch nicht auf dem Brett, und wer die Stellung
   * aus dem DOM liest (e2e), soll sie nicht mitzählen.
   */
  preview?: boolean;
};

export function Piece({ code, dragging = false, size, preview = false }: PieceProps) {
  const theme = useBoardTheme();
  return (
    <img
      data-piece={preview ? undefined : code}
      data-promotion-preview={preview ? code : undefined}
      alt={`${COLOR_NAME[code[0] as 'w' | 'b']} ${TYPE_NAME[code[1] as keyof typeof TYPE_NAME]}`}
      src={theme.pieces[code]}
      draggable={false}
      className={`select-none ${size === undefined ? 'w-[90%] h-auto' : ''} ${
        dragging ? 'opacity-30' : preview ? 'opacity-55' : ''
      }`}
      style={size === undefined ? undefined : { width: size, height: size }}
    />
  );
}

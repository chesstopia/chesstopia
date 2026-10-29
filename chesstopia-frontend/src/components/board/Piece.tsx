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
};

export function Piece({ code, dragging = false, size }: PieceProps) {
  const theme = useBoardTheme();
  return (
    <img
      data-piece={code}
      alt={`${COLOR_NAME[code[0] as 'w' | 'b']} ${TYPE_NAME[code[1] as keyof typeof TYPE_NAME]}`}
      src={theme.pieces[code]}
      draggable={false}
      className={`select-none ${size === undefined ? 'w-[90%] h-[90%]' : ''} ${
        dragging ? 'opacity-30' : ''
      }`}
      style={size === undefined ? undefined : { width: size, height: size }}
    />
  );
}

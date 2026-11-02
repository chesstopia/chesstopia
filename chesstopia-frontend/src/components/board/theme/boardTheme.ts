import type { PieceCode } from '@/lib/position';
import wK from '@/assets/themes/flach/wK.svg';
import wQ from '@/assets/themes/flach/wQ.svg';
import wR from '@/assets/themes/flach/wR.svg';
import wB from '@/assets/themes/flach/wB.svg';
import wN from '@/assets/themes/flach/wN.svg';
import wP from '@/assets/themes/flach/wP.svg';
import bK from '@/assets/themes/flach/bK.svg';
import bQ from '@/assets/themes/flach/bQ.svg';
import bR from '@/assets/themes/flach/bR.svg';
import bB from '@/assets/themes/flach/bB.svg';
import bN from '@/assets/themes/flach/bN.svg';
import bP from '@/assets/themes/flach/bP.svg';

/** Ein austauschbares Aussehen des Bretts: Figurenbilder und Feldfarben. */
export type BoardTheme = {
  id: string;
  name: string;
  pieces: Record<PieceCode, string>;
  colors: {
    lightSquare: string;
    darkSquare: string;
    lastMove: string;
    dragSource: string;
    dragTarget: string;
  };
  /** Rahmen um das Königsfeld; `width` ist eine CSS-Länge. */
  markers: {
    check: { color: string; width: string };
    mate: { color: string; width: string };
  };
  /** Dämpfung des ganzen Bretts, sobald die Partie beendet ist. */
  ended: { opacity: number; saturate: number };
};

export const FLACH: BoardTheme = {
  id: 'flach',
  name: 'Flach',
  pieces: { wK, wQ, wR, wB, wN, wP, bK, bQ, bR, bB, bN, bP },
  colors: {
    lightSquare: '#ece8df',
    darkSquare: '#9aa5a0',
    lastMove: 'rgba(250,204,21,.38)',
    // Gedeckte Ringe: die Quelle dunkel, das Ziel heller — beide lesen sich auf Grau und Creme.
    dragSource: 'rgba(28,25,23,.55)',
    dragTarget: 'rgba(28,25,23,.28)',
  },
  // Orange statt Rot: klar unterscheidbar vom gelben Letzter-Zug-Marker, aber kein Alarm.
  markers: {
    check: { color: '#ea580c', width: '4px' },
    mate: { color: '#ea580c', width: '4px' },
  },
  ended: { opacity: 0.8, saturate: 0.7 },
};

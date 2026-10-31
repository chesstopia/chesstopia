import type { FeedbackEvent } from '@/lib/feedback';
import move from '@/assets/sound-themes/standard/move.ogg';
import checkReceived from '@/assets/sound-themes/standard/check-received.ogg';
import checkGiven from '@/assets/sound-themes/standard/check-given.ogg';
import win from '@/assets/sound-themes/standard/win.ogg';
import loss from '@/assets/sound-themes/standard/loss.ogg';
import draw from '@/assets/sound-themes/standard/draw.ogg';

/** Ein austauschbarer Satz Töne — ein Eintrag je Feedback-Ereignis, keiner darf fehlen. */
export type SoundTheme = {
  id: string;
  name: string;
  sounds: Record<FeedbackEvent, string>;
};

/** Herkunft und Lizenz der Dateien: `assets/sound-themes/standard/SOURCES.md` (alle CC0). */
export const STANDARD: SoundTheme = {
  id: 'standard',
  name: 'Standard',
  sounds: {
    move,
    'check-received': checkReceived,
    'check-given': checkGiven,
    win,
    loss,
    draw,
  },
};

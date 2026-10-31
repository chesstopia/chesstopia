import { useEffect, useRef } from 'react';
import { useSoundTheme } from '@/components/sound/theme/SoundThemeProvider';
import type { FeedbackEvent } from '@/lib/feedback';
import { playSound } from '@/lib/sound';
import { useSoundMuted } from '@/hooks/useSoundMuted';

/**
 * Spielt den Ton eines Feedback-Ereignisses, einmal pro neuem `seq`. Der
 * Ref-Guard verhindert, dass ein erneuter Effektlauf (Lautschalten,
 * Theme-Wechsel, StrictMode) einen schon behandelten Übergang nachspielt.
 */
export function useMoveSound(event: FeedbackEvent | null, seq: number): void {
  const theme = useSoundTheme();
  const [muted] = useSoundMuted();
  const handledSeq = useRef(0);

  useEffect(() => {
    if (seq === handledSeq.current) return;
    handledSeq.current = seq;
    if (event !== null && !muted) playSound(theme.sounds[event]);
  }, [event, seq, muted, theme]);
}

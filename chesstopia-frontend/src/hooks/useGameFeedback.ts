import { useEffect, useRef, useState } from 'react';
import type { GameResponse } from '@chesstopia/openapi-client';
import { useSoundTheme } from '@/components/sound/theme/SoundThemeProvider';
import { detectFeedbackEvent, type FeedbackEvent, type GameSnapshot } from '@/lib/feedback';
import { BASE_TITLE, gameTitle, withAttention } from '@/lib/gameTitle';
import type { Side } from '@/lib/position';
import { playSound } from '@/lib/sound';
import { useSoundMuted } from '@/lib/soundSettings';

type Args = {
  role: Side | null;
  moveCount: number;
  sideToMove: Side | null;
  inCheck: boolean;
  status: GameResponse['status'];
};

/** Der zuletzt ausgewertete Zustand und das Ereignis, das er ausgelöst hat; `seq` zählt Übergänge. */
type Held = { snapshot: GameSnapshot | null; event: FeedbackEvent | null; seq: number };

function sameSnapshot(a: GameSnapshot, b: GameSnapshot): boolean {
  return a.moveCount === b.moveCount && a.sideToMove === b.sideToMove && a.inCheck === b.inCheck && a.status === b.status;
}

/**
 * Hörbares und sichtbares Feedback für Übergänge der Partie: Ton aus dem
 * Sound-Theme, Tab-Titel mit `●`, solange etwas im verborgenen Tab passiert
 * ist, und das einmalige Wackeln des Königs bei Schach.
 *
 * Der Übergang wird beim Rendern abgeleitet („vorigen Zustand in State
 * halten“) statt in einem Effekt — ein synchrones `setState` im Effekt
 * verbietet `react-hooks/set-state-in-effect`. Ton und Titel sind
 * Seiteneffekte und laufen danach im Effekt, gesteuert über `seq`.
 */
export function useGameFeedback({ role, moveCount, sideToMove, inCheck, status }: Args): { animateCheck: boolean } {
  const theme = useSoundTheme();
  const [muted] = useSoundMuted();
  const [held, setHeld] = useState<Held>({ snapshot: null, event: null, seq: 0 });

  const snapshot: GameSnapshot | null = sideToMove === null ? null : { moveCount, sideToMove, inCheck, status };
  if (snapshot !== null && (held.snapshot === null || !sameSnapshot(held.snapshot, snapshot))) {
    const isTransition = held.snapshot !== null && snapshot.moveCount > held.snapshot.moveCount;
    setHeld({
      snapshot,
      event: isTransition ? detectFeedbackEvent(held.snapshot, snapshot, role) : held.event,
      seq: isTransition ? held.seq + 1 : held.seq,
    });
  }

  const title = held.snapshot === null ? BASE_TITLE : gameTitle(held.snapshot, role);
  const attention = useRef(false);
  const currentTitle = useRef(title);
  const handledSeq = useRef(0);

  useEffect(() => {
    if (held.seq === handledSeq.current) return;
    handledSeq.current = held.seq;
    if (held.event === null) return;
    if (!muted) playSound(theme.sounds[held.event]);
    // `●` heißt „hier wartet etwas auf dich“: nur für Spieler, und nur wenn der
    // Gegner gezogen hat — also man selbst jetzt am Zug ist (auch nach seinem Matt).
    const opponentMoved = role !== null && held.snapshot?.sideToMove === role;
    if (document.hidden && opponentMoved) attention.current = true;
  }, [held, muted, theme, role]);

  useEffect(() => {
    currentTitle.current = title;
    document.title = withAttention(title, attention.current);
  }, [title, held]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) return;
      attention.current = false;
      document.title = currentTitle.current;
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.title = BASE_TITLE;
    };
  }, []);

  const animateCheck = held.event === 'check-given' || held.event === 'check-received';
  return { animateCheck };
}

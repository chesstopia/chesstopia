import { useEffect, useRef } from 'react';
import { BASE_TITLE, withAttention } from '@/lib/gameTitle';

/**
 * Setzt den Tab-Titel. Steigt `attentionSeq`, während der Tab verborgen ist,
 * bekommt der Titel ein `●`, bis der Tab wieder sichtbar wird. Beim Unmount
 * gilt der Basistitel.
 */
export function useTabTitle(title: string, attentionSeq: number): void {
  const attention = useRef(false);
  const currentTitle = useRef(title);
  const handledSeq = useRef(0);

  useEffect(() => {
    if (attentionSeq !== handledSeq.current) {
      handledSeq.current = attentionSeq;
      if (document.hidden) attention.current = true;
    }
    currentTitle.current = title;
    document.title = withAttention(title, attention.current);
  }, [title, attentionSeq]);

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
}

import { useCallback, useSyncExternalStore } from 'react';
import { isMuted, setMuted, subscribeMuted } from '@/lib/soundSettings';

/** Stummschaltung als React-Zustand; alle Nutzer sehen dieselbe Änderung. */
export function useSoundMuted(): [boolean, (muted: boolean) => void] {
  const muted = useSyncExternalStore(subscribeMuted, isMuted);
  return [muted, useCallback((value: boolean) => setMuted(value), [])];
}

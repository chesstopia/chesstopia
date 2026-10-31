import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'chesstopia.soundMuted';
const listeners = new Set<() => void>();

/** Stummschaltung dieses Browsers, gilt für alle Partien. Standard: Ton an. */
export function isMuted(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setMuted(muted: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(muted));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Ein anderer Tab desselben Browsers schaltet mit.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/** Stummschaltung als React-Zustand; alle Nutzer sehen dieselbe Änderung. */
export function useSoundMuted(): [boolean, (muted: boolean) => void] {
  const muted = useSyncExternalStore(subscribe, isMuted);
  return [muted, useCallback((value: boolean) => setMuted(value), [])];
}

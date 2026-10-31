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

export function subscribeMuted(listener: () => void): () => void {
  listeners.add(listener);
  // Ein anderer Tab desselben Browsers schaltet mit.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

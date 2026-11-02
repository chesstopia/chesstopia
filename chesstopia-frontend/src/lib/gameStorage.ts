import type { Side } from '@/lib/position';

export type GameRole = 'OWNER' | 'INVITED';

export type StoredGame = {
  gameId: string;
  role: GameRole;
  ownerToken?: string;
  inviteToken?: string;
};

const STORAGE_KEY = 'chesstopia.games';

function loadGames(): StoredGame[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredGame[]) : [];
  } catch {
    return [];
  }
}

function saveGames(games: StoredGame[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function addOwnedGame(gameId: string, ownerToken: string, inviteToken: string): StoredGame {
  const entry: StoredGame = { gameId, role: 'OWNER', ownerToken, inviteToken };
  saveGames([...loadGames(), entry]);
  return entry;
}

export function addInvitedGame(gameId: string, inviteToken: string): StoredGame {
  const existing = findGame(gameId);
  if (existing) return existing;
  const entry: StoredGame = { gameId, role: 'INVITED', inviteToken };
  saveGames([...loadGames(), entry]);
  return entry;
}

export function findGame(gameId: string): StoredGame | undefined {
  return loadGames().find((g) => g.gameId === gameId);
}

export function removeGame(gameId: string): void {
  saveGames(loadGames().filter((g) => g.gameId !== gameId));
}

export function myGames(): StoredGame[] {
  return loadGames().filter((g) => g.role === 'OWNER');
}

/** Alle gemerkten Partien, eigene und eingeladene, in Einfügereihenfolge. */
export function allGames(): StoredGame[] {
  return loadGames();
}

/**
 * Farbe (`Side`), die eine Rolle (`GameRole`) spielt: Der Besitzer legt die Partie
 * an und spielt Weiß, der Eingeladene spielt Schwarz. `GameRole` ist die Beziehung
 * zur Partie, `Side` die Farbe auf dem Brett.
 */
export function sideOfGameRole(role: GameRole): Side {
  return role === 'OWNER' ? 'w' : 'b';
}

/**
 * Farbe (`Side`), die der gemerkte Eintrag spielt; `null`, wenn die Partie nicht
 * gemerkt ist (Zuschauer ohne Rolle).
 */
export function playerSideOf(entry: StoredGame | undefined): Side | null {
  return entry ? sideOfGameRole(entry.role) : null;
}

/**
 * Token, mit dem der Eintrag Züge macht (`X-Player-Token`): beim `OWNER` der
 * `ownerToken`, beim `INVITED` der `inviteToken`. `undefined` ohne Eintrag.
 */
export function playerTokenOf(entry: StoredGame | undefined): string | undefined {
  if (entry?.role === 'OWNER') return entry.ownerToken;
  if (entry?.role === 'INVITED') return entry.inviteToken;
  return undefined;
}

/**
 * Token zum Weitergeben der Einladung: nur der `OWNER` hat ihn zum Teilen; ein
 * `INVITED` oder fehlender Eintrag liefert `null`.
 */
export function inviteTokenOf(entry: StoredGame | undefined): string | null {
  return entry?.role === 'OWNER' ? (entry.inviteToken ?? null) : null;
}

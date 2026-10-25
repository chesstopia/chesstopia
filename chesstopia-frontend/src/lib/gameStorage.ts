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

export function myGames(): StoredGame[] {
  return loadGames().filter((g) => g.role === 'OWNER');
}

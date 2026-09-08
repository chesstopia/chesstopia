import { describe, it, expect, beforeEach } from 'vitest';
import { addOwnedGame, addInvitedGame, findGame, myGames } from '../gameStorage';

describe('gameStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('legt einen Owner-Eintrag mit beiden Tokens an', () => {
    // ACT
    const entry = addOwnedGame('g1', 'owner-1', 'invite-1');

    // ASSERTIONS
    expect(entry).toEqual({ gameId: 'g1', role: 'OWNER', ownerToken: 'owner-1', inviteToken: 'invite-1' });
    expect(findGame('g1')).toEqual(entry);
  });

  it('legt einen Invited-Eintrag beim ersten Aufruf an', () => {
    // ACT
    const entry = addInvitedGame('g2', 'invite-2');

    // ASSERTIONS
    expect(entry).toEqual({ gameId: 'g2', role: 'INVITED', inviteToken: 'invite-2' });
  });

  it('legt keinen zweiten Invited-Eintrag an, wenn schon einer existiert', () => {
    // ARRANGE
    const first = addInvitedGame('g3', 'invite-3');

    // ACT
    const second = addInvitedGame('g3', 'ein-anderes-token');

    // ASSERTIONS
    expect(second).toEqual(first);
    expect(findGame('g3')).toEqual(first);
  });

  it('myGames liefert nur Owner-Partien in Einfuegereihenfolge', () => {
    // ARRANGE
    addOwnedGame('g4', 'o4', 'i4');
    addInvitedGame('g5', 'i5');
    addOwnedGame('g6', 'o6', 'i6');

    // ACT
    const games = myGames();

    // ASSERTIONS
    expect(games).toEqual([
      { gameId: 'g4', role: 'OWNER', ownerToken: 'o4', inviteToken: 'i4' },
      { gameId: 'g6', role: 'OWNER', ownerToken: 'o6', inviteToken: 'i6' },
    ]);
  });

  it('findGame liefert undefined fuer unbekannte Partien', () => {
    // ACT & ASSERTIONS
    expect(findGame('unbekannt')).toBeUndefined();
  });

  it('uebersteht kaputten JSON-Inhalt im Storage', () => {
    // ARRANGE
    localStorage.setItem('chesstopia.games', '{kaputt');

    // ACT & ASSERTIONS
    expect(findGame('irgendwas')).toBeUndefined();
    expect(myGames()).toEqual([]);
  });
});

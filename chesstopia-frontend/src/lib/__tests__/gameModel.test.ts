import { describe, expect, it } from 'vitest';
import type { GameResponse, MoveRecord } from '@chesstopia/openapi-client';
import { gameReducer, initGameModel } from '../gameModel';
import type { GameModel } from '../gameModel';

const game = (
  moveCount: number,
  checkState: GameResponse['checkState'] = 'NO_CHECK',
  status: GameResponse['status'] = 'ONGOING',
): GameResponse =>
  // Weiß zieht bei geradem `moveCount`.
  ({ id: 'g-1', status, checkState, moveCount, position: { sideToMove: moveCount % 2 === 0 ? 'WHITE' : 'BLACK' } }) as GameResponse;
const record = (n: number): MoveRecord => ({ moveNumber: n }) as MoveRecord;
const model = (overrides: Partial<GameModel> = {}): GameModel => ({ ...initGameModel('w'), ...overrides });

describe('gameModel', () => {
  it('serverUpdate übernimmt bei höherem und bei gleichem moveCount', () => {
    // ARRANGE
    const held = model({ game: game(1) });
    const higher = game(2);
    const equal = game(1, 'CHECK_WHITE');

    // ACT
    const afterHigher = gameReducer(held, { type: 'serverUpdate', game: higher });
    const afterEqual = gameReducer(held, { type: 'serverUpdate', game: equal });

    // ASSERTIONS
    expect(afterHigher.game).toBe(higher);
    expect(afterEqual.game).toBe(equal);
  });

  it('serverUpdate verwirft einen kleineren moveCount und gibt dasselbe Objekt zurück', () => {
    // ARRANGE
    const held = model({ game: game(3) });

    // ACT
    const next = gameReducer(held, { type: 'serverUpdate', game: game(2) });

    // ASSERTIONS
    expect(next).toBe(held);
  });

  it('serverUpdate wird auch nach deleted übernommen', () => {
    // ARRANGE
    const held = model({ game: game(1), deleted: true });
    const update = game(2);

    // ACT
    const next = gameReducer(held, { type: 'serverUpdate', game: update });

    // ASSERTIONS
    expect(next.game).toBe(update);
    expect(next.deleted).toBe(true);
  });

  it('loadSucceeded setzt loaded', () => {
    // ARRANGE
    const loaded = game(0);

    // ACT
    const next = gameReducer(initGameModel('w'), { type: 'loadSucceeded', game: loaded });

    // ASSERTIONS
    expect(next.loaded).toBe(true);
    expect(next.game).toBe(loaded);
  });

  it('loadSucceeded verwirft einen kleineren moveCount, setzt aber loaded', () => {
    // ARRANGE
    const held = model({ game: game(3) });

    // ACT
    const next = gameReducer(held, { type: 'loadSucceeded', game: game(2) });

    // ASSERTIONS
    expect(next.game).toBe(held.game);
    expect(next.loaded).toBe(true);
    expect(next.feedback).toBe(held.feedback);
  });

  it('loadSucceeded gibt bei kleinerem moveCount und schon gesetztem loaded dasselbe Objekt zurück', () => {
    // ARRANGE
    const held = model({ game: game(3), loaded: true });

    // ACT
    const next = gameReducer(held, { type: 'loadSucceeded', game: game(2) });

    // ASSERTIONS
    expect(next).toBe(held);
  });

  it('loadFailed setzt loaded und error', () => {
    // ARRANGE
    const error = new Error('kaputt');

    // ACT
    const next = gameReducer(initGameModel('w'), { type: 'loadFailed', error });

    // ASSERTIONS
    expect(next.loaded).toBe(true);
    expect(next.error).toBe(error);
  });

  it('deleted setzt loaded nur mit fromLoad und leert in beiden Fällen error', () => {
    // ARRANGE
    const held = model({ error: new Error('alt') });

    // ACT
    const fromLoad = gameReducer(held, { type: 'deleted', fromLoad: true });
    const later = gameReducer(held, { type: 'deleted', fromLoad: false });

    // ASSERTIONS
    expect(fromLoad).toMatchObject({ deleted: true, loaded: true, error: null });
    expect(later).toMatchObject({ deleted: true, loaded: false, error: null });
  });

  it('failed überschreibt einen vorhandenen Fehler', () => {
    // ARRANGE
    const held = model({ error: new Error('erster') });
    const second = new Error('zweiter');

    // ACT
    const next = gameReducer(held, { type: 'failed', error: second });

    // ASSERTIONS
    expect(next.error).toBe(second);
  });

  it('moveStarted leert error und setzt pending, moveSettled setzt pending zurück und lässt error stehen', () => {
    // ARRANGE
    const held = model({ error: new Error('alt') });
    const later = new Error('Zug abgelehnt');

    // ACT
    const started = gameReducer(held, { type: 'moveStarted' });
    const settled = gameReducer({ ...started, error: later }, { type: 'moveSettled' });

    // ASSERTIONS
    expect(started).toMatchObject({ pending: true, error: null });
    expect(settled).toMatchObject({ pending: false, error: later });
  });

  it('serverUpdate leert error nicht', () => {
    // ARRANGE
    const error = new Error('Ladefehler');
    const held = model({ error });

    // ACT
    const next = gameReducer(held, { type: 'serverUpdate', game: game(1) });

    // ASSERTIONS
    expect(next.error).toBe(error);
  });

  it('historyLoaded leert error nicht', () => {
    // ARRANGE
    const error = new Error('Ladefehler');
    const held = model({ error });

    // ACT
    const next = gameReducer(held, { type: 'historyLoaded', moves: [record(1)] });

    // ASSERTIONS
    expect(next.error).toBe(error);
  });

  it('historyLoaded übernimmt eine gleich lange oder längere Liste und verwirft eine kürzere', () => {
    // ARRANGE
    const held = model({ moves: [record(1), record(2)] });
    const equal = [record(1), record(2)];
    const longer = [record(1), record(2), record(3)];

    // ACT
    const afterEqual = gameReducer(held, { type: 'historyLoaded', moves: equal });
    const afterLonger = gameReducer(held, { type: 'historyLoaded', moves: longer });
    const afterShorter = gameReducer(held, { type: 'historyLoaded', moves: [record(1)] });

    // ASSERTIONS
    expect(afterEqual.moves).toBe(equal);
    expect(afterLonger.moves).toBe(longer);
    expect(afterShorter).toBe(held);
  });

  describe('feedback', () => {
    it('löst beim ersten Stand kein Ereignis aus', () => {
      // ACT
      const next = gameReducer(initGameModel('w'), { type: 'loadSucceeded', game: game(2) });

      // ASSERTIONS
      expect(next.feedback).toEqual({ event: null, seq: 0, attentionSeq: 0 });
    });

    it('löst beim ersten Stand im Schach kein Schach-Ereignis aus', () => {
      // ACT
      const next = gameReducer(initGameModel('w'), { type: 'loadSucceeded', game: game(2, 'CHECK_WHITE') });

      // ASSERTIONS
      expect(next.feedback).toEqual({ event: null, seq: 0, attentionSeq: 0 });
    });

    it('meldet den Zug des Gegners und zählt seq und attentionSeq hoch', () => {
      // ARRANGE
      const held = model({ game: game(1) });

      // ACT
      const next = gameReducer(held, { type: 'serverUpdate', game: game(2) });

      // ASSERTIONS
      expect(next.feedback).toEqual({ event: 'move', seq: 1, attentionSeq: 1 });
    });

    it('lässt seq beim WS-Echo mit gleichem moveCount unverändert', () => {
      // ARRANGE
      const afterMove = gameReducer(model({ game: game(1) }), { type: 'serverUpdate', game: game(2) });

      // ACT
      const next = gameReducer(afterMove, { type: 'serverUpdate', game: game(2) });

      // ASSERTIONS
      expect(next.feedback).toBe(afterMove.feedback);
    });

    it('zählt beim eigenen Zug ohne Schach nur seq hoch, ohne Ereignis und ohne attentionSeq', () => {
      // ARRANGE
      const held = model({ game: game(2), feedback: { event: 'move', seq: 1, attentionSeq: 1 } });

      // ACT
      const next = gameReducer(held, { type: 'serverUpdate', game: game(3) });

      // ASSERTIONS
      expect(next.feedback).toEqual({ event: null, seq: 2, attentionSeq: 1 });
    });

    it('zählt attentionSeq für die Folgen des eigenen Zugs nicht hoch, auch beim eigenen Matt', () => {
      // ARRANGE
      const held = model({ game: game(4) });

      // ACT
      const next = gameReducer(held, { type: 'serverUpdate', game: game(5, 'CHECK_BLACK', 'WHITE_WON') });

      // ASSERTIONS
      expect(next.feedback).toEqual({ event: 'win', seq: 1, attentionSeq: 0 });
    });

    it('meldet Schach und beim nächsten Zug ohne Schach kein Schach-Ereignis mehr', () => {
      // ARRANGE
      const held = model({ game: game(1) });

      // ACT
      const inCheck = gameReducer(held, { type: 'serverUpdate', game: game(2, 'CHECK_WHITE') });
      const next = gameReducer(inCheck, { type: 'serverUpdate', game: game(3) });

      // ASSERTIONS
      expect(inCheck.feedback.event).toBe('check-received');
      expect(next.feedback.event).toBeNull();
    });

    it('zählt attentionSeq für Zuschauer nicht hoch', () => {
      // ARRANGE
      const held = { ...initGameModel(null), game: game(1) };

      // ACT
      const next = gameReducer(held, { type: 'serverUpdate', game: game(2) });

      // ASSERTIONS
      expect(next.feedback).toEqual({ event: 'move', seq: 1, attentionSeq: 0 });
    });

    it('nimmt bei zwei Zügen vor einem Render das Ereignis aus dem neuesten Stand', () => {
      // ARRANGE
      const held = model({ game: game(1) });

      // ACT
      const afterOpponent = gameReducer(held, { type: 'serverUpdate', game: game(2) });
      const next = gameReducer(afterOpponent, { type: 'serverUpdate', game: game(3, 'CHECK_BLACK') });

      // ASSERTIONS
      expect(next.feedback).toEqual({ event: 'check-given', seq: 2, attentionSeq: 1 });
    });
  });
  describe('Umwandlung', () => {
    const open = { from: 'e7', to: 'e8' };

    it('promotionStarted öffnet die Auswahl und leert den Fehler', () => {
      // ARRANGE
      const held = model({ game: game(0), error: new Error('alt') });

      // ACT
      const next = gameReducer(held, { type: 'promotionStarted', from: 'e7', to: 'e8' });

      // ASSERTIONS
      expect(next.promotion).toEqual(open);
      expect(next.error).toBeNull();
    });

    it('promotionCancelled schließt die Auswahl', () => {
      // ARRANGE
      const held = model({ game: game(0), promotion: open });

      // ACT
      const next = gameReducer(held, { type: 'promotionCancelled' });

      // ASSERTIONS
      expect(next.promotion).toBeNull();
    });

    it('promotionCancelled ohne offene Auswahl gibt dasselbe Objekt zurück', () => {
      // ARRANGE
      const held = model({ game: game(0) });

      // ACT
      const next = gameReducer(held, { type: 'promotionCancelled' });

      // ASSERTIONS
      expect(next).toBe(held);
    });

    it('moveStarted schließt die Auswahl', () => {
      // ARRANGE
      const held = model({ game: game(0), promotion: open });

      // ACT
      const next = gameReducer(held, { type: 'moveStarted' });

      // ASSERTIONS
      expect(next.promotion).toBeNull();
    });

    it('schließt die Auswahl bei beendeter Partie', () => {
      // ARRANGE
      const held = model({ game: game(0), promotion: open });

      // ACT
      const next = gameReducer(held, { type: 'serverUpdate', game: game(0, 'NO_CHECK', 'WHITE_WON') });

      // ASSERTIONS
      expect(next.promotion).toBeNull();
    });

    it('schließt die Auswahl, wenn die geladene Partie beendet ist', () => {
      // ARRANGE
      const held = model({ promotion: open });

      // ACT
      const next = gameReducer(held, { type: 'loadSucceeded', game: game(0, 'NO_CHECK', 'DRAW') });

      // ASSERTIONS
      expect(next.promotion).toBeNull();
    });

    it('schließt die Auswahl beim Löschen', () => {
      // ARRANGE
      const held = model({ game: game(0), promotion: open });

      // ACT
      const next = gameReducer(held, { type: 'deleted', fromLoad: false });

      // ASSERTIONS
      expect(next.promotion).toBeNull();
    });

    it('serverUpdate einer laufenden Partie lässt die Auswahl offen', () => {
      // ARRANGE
      const held = model({ game: game(0), promotion: open });

      // ACT
      const next = gameReducer(held, { type: 'serverUpdate', game: game(0, 'CHECK_WHITE') });

      // ASSERTIONS
      expect(next.promotion).toEqual(open);
    });
  });
});

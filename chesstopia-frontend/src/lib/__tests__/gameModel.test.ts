import { describe, expect, it } from 'vitest';
import type { GameResponse, MoveRecord } from '@chesstopia/openapi-client';
import { gameReducer, initGameModel } from '../gameModel';
import type { GameModel } from '../gameModel';

const game = (moveCount: number, checkState: GameResponse['checkState'] = 'NO_CHECK'): GameResponse =>
  ({ id: 'g-1', status: 'ONGOING', checkState, moveCount }) as GameResponse;
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
});

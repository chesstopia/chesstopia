import { describe, it, expect } from 'vitest';
import { isNotFound } from '../api';

describe('api', () => {
  it('isNotFound erkennt einen 404-Fehler der Axios-Form', () => {
    // ARRANGE
    const err = { response: { status: 404 } };

    // ACT
    const result = isNotFound(err);

    // ASSERTIONS
    expect(result).toBe(true);
  });

  it('isNotFound ist false bei Status 500', () => {
    // ARRANGE
    const err = { response: { status: 500 } };

    // ACT
    const result = isNotFound(err);

    // ASSERTIONS
    expect(result).toBe(false);
  });

  it('isNotFound ist false bei einem gewoehnlichen Error', () => {
    // ARRANGE
    const err = new Error('x');

    // ACT
    const result = isNotFound(err);

    // ASSERTIONS
    expect(result).toBe(false);
  });

  it('isNotFound ist false bei null', () => {
    // ACT
    const result = isNotFound(null);

    // ASSERTIONS
    expect(result).toBe(false);
  });
});

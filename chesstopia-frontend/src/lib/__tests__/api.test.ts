import { describe, it, expect } from 'vitest';
import { asError, isNotFound } from '../api';

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

  it('asError gibt einen Error unverändert zurück', () => {
    // ARRANGE
    const err = new Error('x');

    // ACT
    const result = asError(err);

    // ASSERTIONS
    expect(result).toBe(err);
  });

  it('asError macht aus einem Nicht-Error dessen String', () => {
    // ACT
    const result = asError('boom');

    // ASSERTIONS
    expect(result.message).toBe('boom');
  });

  it('asError nutzt den Fallback für einen Nicht-Error', () => {
    // ACT
    const result = asError(42, 'Fallback');

    // ASSERTIONS
    expect(result.message).toBe('Fallback');
  });
});

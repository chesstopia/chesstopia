import { afterEach, describe, expect, it, vi } from 'vitest';
import { playSound } from '../sound';

describe('sound', () => {
  afterEach(() => vi.restoreAllMocks());

  it('spielt die Datei über ein Audio-Element ab', () => {
    // ARRANGE
    let played: string | undefined;
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
      played = this.src;
      return Promise.resolve();
    });

    // ACT
    playSound('/sounds/move.ogg');

    // ASSERTIONS
    expect(played).toMatch(/\/sounds\/move\.ogg$/);
  });

  it('schluckt die Ablehnung durch die Autoplay-Policy', async () => {
    // ARRANGE
    const rejected = Promise.reject(new DOMException('blocked', 'NotAllowedError'));
    const caught = vi.spyOn(rejected, 'catch');
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockReturnValue(rejected);

    // ACT
    playSound('/sounds/move.ogg');

    // ASSERTIONS
    expect(caught).toHaveBeenCalled();
    await expect(rejected.catch(() => 'ok')).resolves.toBe('ok');
  });

  it('wirft nicht, wenn play synchron scheitert', () => {
    // ARRANGE
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => {
      throw new Error('not implemented');
    });

    // ACT & ASSERTIONS
    expect(() => playSound('/sounds/move.ogg')).not.toThrow();
  });
});

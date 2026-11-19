import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_TIMEOUT_MS, CLOWN_TIMEOUT_MS, WEB_MOOD_TIMEOUT_MS, apiTimeoutFor } from '../../../bridge/api-timeout';
import { NETWORK_ERROR, RATE_LIMITED_ERROR, chatErrorMessage, withTimeout } from './chat-request';

describe('chatErrorMessage', () => {
  it('gives a 429 its own wording', () => {
    expect(chatErrorMessage(new Error('429'))).toBe(RATE_LIMITED_ERROR);
    expect(RATE_LIMITED_ERROR).toBe('Too many requests, try again in a moment.');
  });

  it.each([new Error('500'), new Error('aborted'), new TypeError('Failed to fetch'), 'nope', undefined])(
    'keeps the generic wording for %s',
    (err) => {
      expect(chatErrorMessage(err)).toBe(NETWORK_ERROR);
    },
  );
});

describe('withTimeout', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const never = () => new Promise<never>(() => {});

  it('gives web Mood 30 s without changing the bridge values', () => {
    expect(WEB_MOOD_TIMEOUT_MS).toBe(30_000);
    expect(apiTimeoutFor('POST', '/api/mood')).toBe(API_TIMEOUT_MS);
    expect(API_TIMEOUT_MS).toBe(8000);
    expect(apiTimeoutFor('POST', '/api/clown')).toBe(CLOWN_TIMEOUT_MS);
  });

  it('resolves with the result and leaves the signal alone when the request finishes in time', async () => {
    const controller = new AbortController();
    await expect(withTimeout(1000, async () => 'ok', controller)).resolves.toBe('ok');
    await vi.advanceTimersByTimeAsync(5000);
    expect(controller.signal.aborted).toBe(false);
  });

  it('aborts and rejects a request that hangs, even if the transport ignores the signal', async () => {
    const controller = new AbortController();
    const result = withTimeout(API_TIMEOUT_MS, never, controller).catch((err: unknown) => err);
    await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS - 1);
    expect(controller.signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(controller.signal.aborted).toBe(true);
    expect(chatErrorMessage(await result)).toBe(NETWORK_ERROR);
  });

  it('keepAlive restarts the clock, so a live stream is not cut', async () => {
    const controller = new AbortController();
    let beat: () => void = () => {};
    const result = withTimeout(
      1000,
      (_signal, keepAlive) => {
        beat = keepAlive;
        return never();
      },
      controller,
    ).catch((err: unknown) => err);
    await vi.advanceTimersByTimeAsync(900);
    beat();
    await vi.advanceTimersByTimeAsync(900);
    expect(controller.signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(100);
    expect(controller.signal.aborted).toBe(true);
    expect(await result).toBeInstanceOf(Error);
  });

  it('passes a request failure through unchanged', async () => {
    await expect(
      withTimeout(1000, async () => {
        throw new Error('429');
      }),
    ).rejects.toThrow('429');
  });

  it('rejects when the caller aborts the controller', async () => {
    const controller = new AbortController();
    const result = withTimeout(1000, never, controller).catch((err: unknown) => err);
    controller.abort();
    expect(await result).toBeInstanceOf(Error);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import { probe } from './image-liveness.mjs';

const imageResponse = () => {
  const png = Buffer.alloc(24);
  png.set([0x89, 0x50, 0x4e, 0x47]);
  png.writeUInt32BE(800, 16);
  png.writeUInt32BE(600, 20);
  const response = new Response(png, {
    status: 206,
    headers: { 'content-type': 'image/png' },
  });
  Object.defineProperty(response, 'url', { value: 'https://i.ytimg.com/vi/example/maxresdefault.jpg' });
  return response;
};

describe('image liveness probe', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('retries transient fetch failures before declaring an image unreachable', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(imageResponse());
    vi.stubGlobal('fetch', fetchMock);

    const resultPromise = probe('https://i.ytimg.com/vi/example/maxresdefault.jpg');
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toMatchObject({ ok: true, status: 206 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('leaves repeated connection failures unverified instead of filing hotlink rot', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    vi.stubGlobal('fetch', fetchMock);

    const resultPromise = probe('https://upload.wikimedia.org/example.jpg');
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toEqual({
      unverified: true,
      reason: 'fetch failed after retries (fetch failed)',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

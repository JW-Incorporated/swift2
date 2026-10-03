import { afterEach, describe, expect, it, vi } from 'vitest';
import { webApiFetch } from './api-fetch';

afterEach(() => vi.unstubAllGlobals());

describe('webApiFetch', () => {
  it('issues a same-origin fetch and flattens the response to a serializable shape', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response('{"ok":true}', { status: 201, headers: { 'content-type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const out = await webApiFetch({
      method: 'POST',
      path: '/api/feedback',
      headers: { 'content-type': 'application/json' },
      body: '{"a":1}',
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"a":1}',
    });
    expect(out).toEqual({
      status: 201,
      headers: { 'content-type': 'application/json' },
      body: '{"ok":true}',
    });
    expect(JSON.parse(JSON.stringify(out))).toEqual(out);
  });

  it('passes non-2xx statuses through without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 429 })));
    const out = await webApiFetch({ method: 'GET', path: '/api/devices/x/prefs' });
    expect(out.status).toBe(429);
    expect(out.body).toBe('nope');
  });
});

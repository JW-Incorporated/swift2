import { describe, expect, it, vi } from 'vitest';
import { waitForContainerReady, isMediaNotReadyError, IG_MEDIA_NOT_READY } from './ig-container.mjs';
import { postToInstagram } from './platforms.mjs';

const GRAPH = 'https://graph.facebook.com/v25.0';

/** lib/platforms.mjs reads bodies via res.text() (parseResponse) while the
 * container poller uses res.json(), so stubbed responses carry both. */
function respond(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) };
}

/** A fetch stub that replays a scripted list of JSON responses in order. */
function scriptedFetch(responses: Array<{ ok?: boolean; status?: number; body: unknown }>) {
  const calls: string[] = [];
  const impl = vi.fn(async (url: string) => {
    calls.push(String(url));
    const next = responses.shift();
    if (!next) throw new Error(`unexpected extra fetch: ${url}`);
    return {
      ok: next.ok ?? true,
      status: next.status ?? 200,
      json: async () => next.body,
    };
  });
  return { impl, calls };
}

describe('waitForContainerReady', () => {
  it('returns as soon as the container reads FINISHED', async () => {
    const { impl, calls } = scriptedFetch([{ body: { status_code: 'FINISHED' } }]);
    const sleep = vi.fn(async () => {});

    const result = await waitForContainerReady(GRAPH, 'tok', '17900', { fetchImpl: impl, sleep });

    expect(result).toEqual({ status: 'FINISHED', polls: 1 });
    expect(sleep).not.toHaveBeenCalled();
    expect(calls[0]).toContain('/17900?fields=status_code');
  });

  it('polls past IN_PROGRESS until FINISHED, sleeping between polls', async () => {
    const { impl } = scriptedFetch([
      { body: { status_code: 'IN_PROGRESS' } },
      { body: { status_code: 'IN_PROGRESS' } },
      { body: { status_code: 'FINISHED' } },
    ]);
    const sleep = vi.fn(async () => {});

    const result = await waitForContainerReady(GRAPH, 'tok', '17900', { fetchImpl: impl, sleep, intervalMs: 3000 });

    expect(result.polls).toBe(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(3000);
  });

  it('treats PUBLISHED as ready rather than stalling to timeout', async () => {
    const { impl } = scriptedFetch([{ body: { status_code: 'PUBLISHED' } }]);
    await expect(waitForContainerReady(GRAPH, 'tok', '1', { fetchImpl: impl, sleep: async () => {} })).resolves.toEqual({
      status: 'PUBLISHED',
      polls: 1,
    });
  });

  it('throws on a terminal ERROR container', async () => {
    const { impl } = scriptedFetch([{ body: { status_code: 'ERROR', status: 'Media download failed' } }]);
    await expect(waitForContainerReady(GRAPH, 'tok', '1', { fetchImpl: impl, sleep: async () => {} })).rejects.toThrow(
      /terminal status ERROR/,
    );
  });

  it('throws on a terminal EXPIRED container', async () => {
    const { impl } = scriptedFetch([{ body: { status_code: 'EXPIRED' } }]);
    await expect(waitForContainerReady(GRAPH, 'tok', '1', { fetchImpl: impl, sleep: async () => {} })).rejects.toThrow(
      /terminal status EXPIRED/,
    );
  });

  it('is bounded — gives up after timeoutMs instead of polling forever', async () => {
    // Clock advances 40s per sleep against a 90s ceiling: polls at t=0, 40,
    // 80, 120 — the fourth finds t past the deadline and gives up.
    let t = 0;
    const impl = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ status_code: 'IN_PROGRESS' }) }));
    const sleep = vi.fn(async () => {
      t += 40_000;
    });

    await expect(
      waitForContainerReady(GRAPH, 'tok', '1', { fetchImpl: impl, sleep, now: () => t, timeoutMs: 90_000 }),
    ).rejects.toThrow(/still "IN_PROGRESS" after 90s/);
    expect(impl).toHaveBeenCalledTimes(4);
  });

  it('surfaces a non-2xx status read as a normal failure', async () => {
    const { impl } = scriptedFetch([{ ok: false, status: 400, body: { error: { message: 'bad token' } } }]);
    await expect(waitForContainerReady(GRAPH, 'tok', '1', { fetchImpl: impl, sleep: async () => {} })).rejects.toThrow(
      /container status check failed .* \(400\)/,
    );
  });
});

describe('isMediaNotReadyError', () => {
  // The trap: Meta stamps is_transient:false on the one error whose own
  // user-facing message says to wait. Any future "fail fast on non-transient"
  // rule must exclude this — see ig-container.mjs's header.
  const real = {
    error: {
      message: 'Media ID is not available',
      code: IG_MEDIA_NOT_READY.code,
      error_subcode: IG_MEDIA_NOT_READY.subcode,
      is_transient: false,
      error_user_msg: 'The media is not ready for publishing, please wait for a moment',
    },
  };

  it('identifies 9007/2207027 despite is_transient being false', () => {
    expect(real.error.is_transient).toBe(false);
    expect(isMediaNotReadyError(real)).toBe(true);
    expect(isMediaNotReadyError(real.error)).toBe(true);
  });

  it('does not match other Graph errors', () => {
    expect(isMediaNotReadyError({ error: { code: 190, error_subcode: 460 } })).toBe(false);
    expect(isMediaNotReadyError(undefined)).toBe(false);
  });
});

describe('postToInstagram container waits', () => {
  const creds = { igUserId: '999', accessToken: 'tok' };
  const poll = { sleep: async () => {}, intervalMs: 0 };

  it('waits for the single-photo container before publishing', async () => {
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (url: string, init?: { method?: string }) => {
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      if (url.includes('/media_publish')) return respond({ id: 'post-1' });
      if (url.includes('/999/media')) return respond({ id: 'container-1' });
      return respond({ status_code: 'FINISHED' });
    });
    vi.stubGlobal('fetch', fetchImpl);

    const item = { platform: 'instagram', body: 'hi', media: ['/social/a.png'] };
    const result = await postToInstagram(item, creds, 'https://www.longlivets.com', { ...poll, fetchImpl });

    expect(result.id).toBe('post-1');
    // Order matters: create -> status poll -> publish. Publishing before the
    // poll is exactly the #1897 bug.
    expect(calls.map((c) => c.split(' ')[0] + ' ' + c.split('/').slice(4).join('/'))).toEqual([
      'POST 999/media',
      'GET container-1?fields=status_code,status&access_token=tok',
      'POST 999/media_publish',
    ]);
    vi.unstubAllGlobals();
  });

  it('waits on every carousel child AND the parent before publishing', async () => {
    const order: string[] = [];
    let container = 0;
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/media_publish')) {
        order.push('publish');
        return respond({ id: 'post-2' });
      }
      if (url.includes('/999/media')) {
        container += 1;
        order.push(`create:${container}`);
        return respond({ id: `c${container}` });
      }
      order.push(`poll:${url.split('/').pop()?.split('?')[0]}`);
      return respond({ status_code: 'FINISHED' });
    });
    vi.stubGlobal('fetch', fetchImpl);

    const item = { platform: 'instagram', body: 'hi', media: ['/social/a.png', '/social/b.png'] };
    await postToInstagram(item, creds, 'https://www.longlivets.com', { ...poll, fetchImpl });

    expect(order).toEqual([
      'create:1',
      'poll:c1',
      'create:2',
      'poll:c2',
      'create:3', // the parent CAROUSEL container
      'poll:c3',
      'publish',
    ]);
    vi.unstubAllGlobals();
  });

  it('never publishes when the container dies in ERROR', async () => {
    let published = false;
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/media_publish')) {
        published = true;
        return respond({ id: 'nope' });
      }
      if (url.includes('/999/media')) return respond({ id: 'c1' });
      return respond({ status_code: 'ERROR', status: 'download failed' });
    });
    vi.stubGlobal('fetch', fetchImpl);

    const item = { platform: 'instagram', body: 'hi', media: ['/social/a.png'] };
    await expect(postToInstagram(item, creds, 'https://www.longlivets.com', { ...poll, fetchImpl })).rejects.toThrow(
      /terminal status ERROR/,
    );
    expect(published).toBe(false);
    vi.unstubAllGlobals();
  });
});

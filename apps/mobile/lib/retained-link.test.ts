import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => ({ map: new Map<string, string>(), failSet: false }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => store.map.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => {
    if (store.failSet) throw new Error('nope');
    store.map.set(k, v);
  },
  deleteItemAsync: async (k: string) => void store.map.delete(k),
}));

import { createTapGate } from './notification-tap-gate';
import {
  RETAINED_LINK_KEY,
  RETAINED_LINK_TTL_MS,
  currentRetainedLink,
  noteLiveLink,
  parseFreshRetained,
  persistRetainedLink,
  resetRetainedLink,
  retainedLinkRestored,
  takeRetainedLink,
} from './retained-link';
import { startDeepLinkIntake } from './use-deep-links';

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  store.map.clear();
  store.failSet = false;
  resetRetainedLink();
});

describe('parseFreshRetained', () => {
  const raw = (at: number) => JSON.stringify({ url: 'https://www.longlivets.com/?item=a', at });
  it('returns a fresh url', () => expect(parseFreshRetained(raw(1000), 1000 + RETAINED_LINK_TTL_MS)).toBe('https://www.longlivets.com/?item=a'));
  it('drops a stale one', () => expect(parseFreshRetained(raw(1000), 1001 + RETAINED_LINK_TTL_MS)).toBeNull());
  it('drops a future-dated one', () => expect(parseFreshRetained(raw(5000), 1000)).toBeNull());
  it('drops malformed input', () => {
    expect(parseFreshRetained(null, 1)).toBeNull();
    expect(parseFreshRetained('not json', 1)).toBeNull();
    expect(parseFreshRetained('{"url":1,"at":1}', 1)).toBeNull();
  });
});

describe('retained link store', () => {
  it('most recent live link wins and is what Retry persists', async () => {
    noteLiveLink('https://www.longlivets.com/?item=a', 1);
    noteLiveLink('https://www.longlivets.com/?item=b', 2);
    await persistRetainedLink();
    expect(JSON.parse(store.map.get(RETAINED_LINK_KEY)!)).toEqual({ url: 'https://www.longlivets.com/?item=b', at: 2 });
  });

  it('persists nothing when no live link arrived, and swallows write failures', async () => {
    await persistRetainedLink();
    expect(store.map.size).toBe(0);
    noteLiveLink('https://www.longlivets.com/?item=a', 1);
    store.failSet = true;
    await expect(persistRetainedLink()).resolves.toBeUndefined();
  });

  it('take is read-once and deletes even a stale value', async () => {
    noteLiveLink('https://www.longlivets.com/?item=a', 1000);
    await persistRetainedLink();
    expect(await takeRetainedLink(1000 + 5)).toBe('https://www.longlivets.com/?item=a');
    expect(await takeRetainedLink(1000 + 5)).toBeNull();
    noteLiveLink('https://www.longlivets.com/?item=a', 1000);
    await persistRetainedLink();
    expect(await takeRetainedLink(1001 + RETAINED_LINK_TTL_MS)).toBeNull();
    expect(store.map.size).toBe(0);
  });
});

describe('deep link intake with a retained link (#5139)', () => {
  const gateFor = () => {
    const g = createTapGate({ siteUrl: 'https://x.test' });
    g.setNativeNavigator(null);
    return g;
  };

  it('records live links only, latest wins, not the launch URL', async () => {
    let live: (u: string) => void = () => {};
    startDeepLinkIntake(gateFor(), { getInitialURL: async () => 'longlive://?item=init', listen: (cb) => ((live = cb), () => {}) });
    await flush();
    expect(currentRetainedLink()).toBeNull();
    live('longlive://?item=one');
    live('longlive://?item=two');
    expect(currentRetainedLink()?.url).toBe('https://www.longlivets.com/?item=two');
  });

  it('replays the retained link after the initial URL, once', async () => {
    const urls: string[] = [];
    const enqueue = vi.fn((t: { deepLink: string }) => (urls.push(t.deepLink), 'queued' as const));
    startDeepLinkIntake({ enqueue }, {
      getInitialURL: async () => 'longlive://?item=init',
      listen: () => () => {},
      takeRetained: async () => 'https://www.longlivets.com/?item=live',
    });
    await flush();
    expect(urls).toEqual(['https://www.longlivets.com/?item=init', 'https://www.longlivets.com/?item=live']);
  });

  it('replays the retained link even with no initial URL, and ignores a hostile one', async () => {
    const enqueue = vi.fn(() => 'queued' as const);
    startDeepLinkIntake({ enqueue }, { getInitialURL: async () => null, listen: () => () => {}, takeRetained: async () => 'https://evil.test/x' });
    await flush();
    expect(enqueue).not.toHaveBeenCalled();
    startDeepLinkIntake({ enqueue }, { getInitialURL: async () => null, listen: () => () => {}, takeRetained: async () => 'longlive://?item=z' });
    await flush();
    expect(enqueue).toHaveBeenCalledTimes(1);
  });

  it('a retained link equal to the replayed initial URL navigates once', async () => {
    const urls: string[] = [];
    const enqueue = vi.fn((t: { deepLink: string }) => (urls.push(t.deepLink), 'queued' as const));
    startDeepLinkIntake({ enqueue }, {
      getInitialURL: async () => 'longlive://?item=same',
      listen: () => () => {},
      takeRetained: async () => 'https://www.longlivets.com/?item=same',
    });
    await flush();
    expect(urls).toEqual(['https://www.longlivets.com/?item=same']);
    expect(retainedLinkRestored()).toBe(true);
  });

  it('marks the process link-restored only when a valid retained link replays', async () => {
    const enqueue = vi.fn(() => 'queued' as const);
    startDeepLinkIntake({ enqueue }, { getInitialURL: async () => null, listen: () => () => {}, takeRetained: async () => null });
    await flush();
    startDeepLinkIntake({ enqueue }, { getInitialURL: async () => null, listen: () => () => {}, takeRetained: async () => 'https://evil.test/x' });
    await flush();
    expect(retainedLinkRestored()).toBe(false);
    startDeepLinkIntake({ enqueue }, { getInitialURL: async () => null, listen: () => () => {}, takeRetained: async () => 'longlive://?item=z' });
    await flush();
    expect(retainedLinkRestored()).toBe(true);
  });

  it('an expired retained link is dropped and never marks the process restored', async () => {
    noteLiveLink('https://www.longlivets.com/?item=a', 1000);
    await persistRetainedLink();
    const taken = await takeRetainedLink(1001 + RETAINED_LINK_TTL_MS);
    const enqueue = vi.fn(() => 'queued' as const);
    startDeepLinkIntake({ enqueue }, { getInitialURL: async () => null, listen: () => () => {}, takeRetained: async () => taken });
    await flush();
    expect(enqueue).not.toHaveBeenCalled();
    expect(retainedLinkRestored()).toBe(false);
  });

  it('the first live link of a normally launched process (no initial URL) is retained and restored after Retry', async () => {
    let live: (u: string) => void = () => {};
    startDeepLinkIntake({ enqueue: vi.fn(() => 'queued' as const) }, { getInitialURL: async () => null, listen: (cb) => ((live = cb), () => {}) });
    await flush();
    live('longlive://?item=first');
    expect(currentRetainedLink()?.url).toBe('https://www.longlivets.com/?item=first');
    await persistRetainedLink();
    resetRetainedLink();
    const urls: string[] = [];
    startDeepLinkIntake({ enqueue: (t: { deepLink: string }) => (urls.push(t.deepLink), 'queued' as const) }, {
      getInitialURL: async () => null,
      listen: () => () => {},
      takeRetained: () => takeRetainedLink(),
    });
    await flush();
    expect(urls).toEqual(['https://www.longlivets.com/?item=first']);
  });

  it('the url-event echo of the initial URL is not recorded as a live link', async () => {
    let live: (u: string) => void = () => {};
    startDeepLinkIntake(gateFor(), { getInitialURL: async () => 'longlive://?item=init', listen: (cb) => ((live = cb), () => {}) });
    await flush();
    live('longlive://?item=init');
    expect(currentRetainedLink()).toBeNull();
  });

  it('a delivered link is not retained by a later Retry', async () => {
    let live: (u: string) => void = () => {};
    let settle: (id: string) => void = () => {};
    const ids: string[] = [];
    startDeepLinkIntake(
      { enqueue: (t: { id: string }) => (ids.push(t.id), 'queued' as const), onSettled: (cb: (id: string) => void) => ((settle = cb), () => {}) },
      { getInitialURL: async () => null, listen: (cb) => ((live = cb), () => {}) },
    );
    await flush();
    live('longlive://?item=a');
    live('longlive://?item=b');
    settle(ids[0]);
    expect(currentRetainedLink()?.url).toBe('https://www.longlivets.com/?item=b');
    settle(ids[1]);
    expect(currentRetainedLink()).toBeNull();
    await persistRetainedLink();
    expect(store.map.size).toBe(0);
  });

  it('a retained link that is a www/apex or trailing-slash variant of the initial URL navigates once', async () => {
    const enqueue = vi.fn(() => 'queued' as const);
    startDeepLinkIntake({ enqueue }, {
      getInitialURL: async () => 'https://www.longlivets.com/vault/era-1/?a=1&b=2',
      listen: () => () => {},
      takeRetained: async () => 'https://longlivets.com/vault/era-1?b=2&a=1',
    });
    await flush();
    expect(enqueue).toHaveBeenCalledTimes(1);
  });

  it('drops the retained link when a live link was already tapped in this process', async () => {
    let live: (u: string) => void = () => {};
    let release: (u: string | null) => void = () => {};
    const urls: string[] = [];
    startDeepLinkIntake({ enqueue: (t: { deepLink: string }) => (urls.push(t.deepLink), 'queued' as const) }, {
      getInitialURL: async () => null,
      listen: (cb) => ((live = cb), () => {}),
      takeRetained: () => new Promise((r) => (release = r)),
    });
    await flush();
    live('longlive://?item=fresh');
    release('https://www.longlivets.com/?item=old');
    await flush();
    expect(urls).toEqual(['https://www.longlivets.com/?item=fresh']);
  });
});

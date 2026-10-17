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
});

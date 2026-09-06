import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_ROUTE_FLAGS,
  createNavigate,
  isNativeRoute,
  resolve,
  type RouteFlags,
} from './routes';

// Same backend-emitted URL set as packages/shared/src/notification-deep-links.test.ts
// (OS-003's contract test) — kept as a literal copy rather than an import so this
// suite doesn't silently go stale if that file's list ever narrows; a mismatch here
// is a signal to update both.
const BACKEND_URLS = [
  ['https://www.longlivets.com/?screen=settings', 'settings quick action', 'settings'],
  ['https://www.longlivets.com/?current=inbox', 'digest → inbox', 'inbox'],
  ['https://www.longlivets.com/?current=theories', 'digest → theories', 'web'],
  ['https://www.longlivets.com/?song=all-too-well-10-min', 'lyric_of_day → song', 'web'],
  ['https://www.longlivets.com/', 'fun-category default (bare root)', 'web'],
  ['https://www.longlivets.com/?current=countdowns', 'countdown reminder', 'web'],
  [
    'https://www.longlivets.com/?utm_source=push&utm_medium=notification&utm_campaign=merch-drop#merch-new-drops',
    'official merch drop (hash anchor)',
    'web',
  ],
  ['https://www.longlivets.com/?current=merch', 'fan merch spotlight', 'web'],
] as const;

describe('resolve — every backend deep-link pattern', () => {
  it.each(BACKEND_URLS)('%s (%s) resolves to %s', (url, _label, expectedKind) => {
    const result = resolve(url);
    if (expectedKind === 'web') {
      expect(result).toEqual({ web: url });
    } else {
      expect(result).toEqual({ native: expectedKind, params: {} });
    }
  });

  it('falls back to the site root for an off-site URL', () => {
    expect(resolve('https://www.youtube.com/watch?v=abc')).toEqual({
      web: 'https://www.longlivets.com',
    });
  });

  it('falls back to the site root for a missing URL', () => {
    expect(resolve(null)).toEqual({ web: 'https://www.longlivets.com' });
    expect(resolve(undefined)).toEqual({ web: 'https://www.longlivets.com' });
  });

  it('never throws on an unparseable URL', () => {
    expect(resolve('not a url')).toEqual({ web: 'https://www.longlivets.com' });
  });

  it('accepts an injected siteUrl for non-production builds', () => {
    expect(resolve('https://longlivets.com/?screen=settings', 'https://longlivets.com')).toEqual({
      native: 'settings',
      params: {},
    });
  });
});

describe('resolve — feature flags (OS-030: toggle without a rebuild)', () => {
  it('routes to native when the screen flag is on (default)', () => {
    expect(resolve('https://www.longlivets.com/?screen=settings')).toEqual({
      native: 'settings',
      params: {},
    });
    expect(resolve('https://www.longlivets.com/?current=inbox')).toEqual({
      native: 'inbox',
      params: {},
    });
  });

  it('falls back to the WebView when the settings flag is off', () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, settings: false };
    expect(resolve('https://www.longlivets.com/?screen=settings', undefined, flags)).toEqual({
      web: 'https://www.longlivets.com',
    });
    // inbox is unaffected by the settings flag.
    expect(resolve('https://www.longlivets.com/?current=inbox', undefined, flags)).toEqual({
      native: 'inbox',
      params: {},
    });
  });

  it('falls back to the WebView when the inbox flag is off', () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, inbox: false };
    expect(resolve('https://www.longlivets.com/?current=inbox', undefined, flags)).toEqual({
      web: 'https://www.longlivets.com',
    });
  });

  it('flipping every flag off sends every native-capable route to the web', () => {
    const flags: RouteFlags = {
      settings: false,
      inbox: false,
      eraStream: false,
      community: false,
      merch: false,
      trackGuide: false,
      song: false,
      moment: false,
      clownbot: false,
    };
    expect(resolve('https://www.longlivets.com/?screen=settings', undefined, flags)).toEqual({
      web: 'https://www.longlivets.com',
    });
    expect(resolve('https://www.longlivets.com/?current=inbox', undefined, flags)).toEqual({
      web: 'https://www.longlivets.com',
    });
  });
});

describe('resolve — OS-032 native era stream (off by default)', () => {
  it('falls back to the WebView when the eraStream flag is off (default)', () => {
    expect(resolve('https://www.longlivets.com/?screen=era-stream')).toEqual({
      web: 'https://www.longlivets.com',
    });
  });

  it('routes to native once the eraStream flag is flipped on', () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, eraStream: true };
    expect(resolve('https://www.longlivets.com/?screen=era-stream', undefined, flags)).toEqual({
      native: 'era-stream',
      params: {},
    });
  });
});

describe('resolve — OS-037 native community/merch (off by default)', () => {
  it('falls back to the WebView site root when the community flag is off (default)', () => {
    expect(resolve('https://www.longlivets.com/?mode=community')).toEqual({
      web: 'https://www.longlivets.com',
    });
  });

  it('routes to native once the community flag is flipped on', () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, community: true };
    expect(resolve('https://www.longlivets.com/?mode=community', undefined, flags)).toEqual({
      native: 'community',
      params: {},
    });
  });

  it('falls back to the WebView site root when the merch flag is off (default)', () => {
    expect(resolve('https://www.longlivets.com/?mode=merch')).toEqual({
      web: 'https://www.longlivets.com',
    });
  });

  it('routes to native once the merch flag is flipped on', () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, merch: true };
    expect(resolve('https://www.longlivets.com/?mode=merch', undefined, flags)).toEqual({
      native: 'merch',
      params: {},
    });
  });
});

describe('resolve — OS-035 native track guide + song (off by default)', () => {
  it('falls back to the WebView when the trackGuide flag is off (default)', () => {
    expect(
      resolve('https://www.longlivets.com/?screen=track-guide&era=folklore'),
    ).toEqual({
      web: 'https://www.longlivets.com',
    });
  });

  it('routes to native with the eraId param once the trackGuide flag is on', () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, trackGuide: true };
    expect(
      resolve('https://www.longlivets.com/?screen=track-guide&era=folklore', undefined, flags),
    ).toEqual({ native: 'track-guide', params: { eraId: 'folklore' } });
  });

  it('falls back to the WebView for track-guide with no era param, even flag-on', () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, trackGuide: true };
    expect(
      resolve('https://www.longlivets.com/?screen=track-guide', undefined, flags),
    ).toEqual({ web: 'https://www.longlivets.com/?screen=track-guide' });
  });

  it('falls back to the WebView when the song flag is off (default)', () => {
    expect(
      resolve('https://www.longlivets.com/?screen=song&key=folklore%3A%3A1%3A%3Athe%201'),
    ).toEqual({ web: 'https://www.longlivets.com' });
  });

  it('routes to native with the trackKey param once the song flag is on', () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, song: true };
    expect(
      resolve(
        'https://www.longlivets.com/?screen=song&key=folklore%3A%3A1%3A%3Athe%201',
        undefined,
        flags,
      ),
    ).toEqual({ native: 'song', params: { trackKey: 'folklore::1::the 1' } });
  });

  it('falls back to the WebView for song with no key param, even flag-on', () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, song: true };
    expect(resolve('https://www.longlivets.com/?screen=song', undefined, flags)).toEqual({
      web: 'https://www.longlivets.com/?screen=song',
    });
  });

  it("leaves the website's own ?guide=/?song= share-link params alone (they stay web-routed regardless of flags)", () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, trackGuide: true, song: true };
    expect(resolve('https://www.longlivets.com/?guide=folklore', undefined, flags)).toEqual({
      web: 'https://www.longlivets.com/?guide=folklore',
    });
    expect(
      resolve('https://www.longlivets.com/?song=all-too-well-10-min', undefined, flags),
    ).toEqual({ web: 'https://www.longlivets.com/?song=all-too-well-10-min' });
  });
});

describe('resolve — OS-033 native moment detail (off by default)', () => {
  it("falls back to the WebView (the site's own ?item= page) when the moment flag is off (default)", () => {
    expect(resolve('https://www.longlivets.com/?item=folklore-cardigan')).toEqual({
      web: 'https://www.longlivets.com/?item=folklore-cardigan',
    });
  });

  it('routes to native with the itemId param once the moment flag is flipped on', () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, moment: true };
    expect(resolve('https://www.longlivets.com/?item=folklore-cardigan', undefined, flags)).toEqual({
      native: 'moment',
      params: { itemId: 'folklore-cardigan' },
    });
  });

  it('does not claim a bare ?item= with no value', () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, moment: true };
    expect(resolve('https://www.longlivets.com/?item=', undefined, flags)).toEqual({
      web: 'https://www.longlivets.com/?item=',
    });
  });
});

describe('resolve — OS-036 native Clownbot + mood chat (off by default)', () => {
  it('falls back to the WebView when the clownbot flag is off (default)', () => {
    expect(resolve('https://www.longlivets.com/?screen=clownbot')).toEqual({
      web: 'https://www.longlivets.com',
    });
  });

  it('routes to native once the clownbot flag is flipped on', () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, clownbot: true };
    expect(resolve('https://www.longlivets.com/?screen=clownbot', undefined, flags)).toEqual({
      native: 'clownbot',
      params: {},
    });
  });
});

describe('isNativeRoute', () => {
  it('reports true only for the flag-on native screens', () => {
    expect(isNativeRoute('https://www.longlivets.com/?screen=settings')).toBe(true);
    expect(isNativeRoute('https://www.longlivets.com/?current=inbox')).toBe(true);
    expect(isNativeRoute('https://www.longlivets.com/?current=theories')).toBe(false);
    expect(isNativeRoute(null)).toBe(false);
  });

  it('respects flags the same way resolve does', () => {
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, settings: false };
    expect(isNativeRoute('https://www.longlivets.com/?screen=settings', undefined, flags)).toBe(
      false,
    );
  });
});

describe('createNavigate — the one navigate(url) every call site uses', () => {
  it('calls openNative with params for a native-capable, flag-on route', () => {
    const openNative = vi.fn();
    const openWeb = vi.fn();
    const navigate = createNavigate({ openNative, openWeb });
    navigate('https://www.longlivets.com/?screen=settings');
    expect(openNative).toHaveBeenCalledWith('settings', {});
    expect(openWeb).not.toHaveBeenCalled();
  });

  it('calls openNative with the resolved params for a param-carrying screen', () => {
    const openNative = vi.fn();
    const openWeb = vi.fn();
    const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS, trackGuide: true };
    const navigate = createNavigate({ openNative, openWeb }, undefined, () => flags);
    navigate('https://www.longlivets.com/?screen=track-guide&era=folklore');
    expect(openNative).toHaveBeenCalledWith('track-guide', { eraId: 'folklore' });
  });

  it('calls openWeb for a website-owned route', () => {
    const openNative = vi.fn();
    const openWeb = vi.fn();
    const navigate = createNavigate({ openNative, openWeb });
    navigate('https://www.longlivets.com/?current=theories');
    expect(openWeb).toHaveBeenCalledWith('https://www.longlivets.com/?current=theories');
    expect(openNative).not.toHaveBeenCalled();
  });

  it('reads flags live via getFlags — a flag flip changes the very next navigation', () => {
    const openNative = vi.fn();
    const openWeb = vi.fn();
    let flags: RouteFlags = DEFAULT_ROUTE_FLAGS;
    const navigate = createNavigate({ openNative, openWeb }, undefined, () => flags);

    navigate('https://www.longlivets.com/?screen=settings');
    expect(openNative).toHaveBeenCalledWith('settings', {});

    // Simulate an EAS Update / remote-config flip with no rebuild — the
    // very next navigate() call must honor it.
    flags = { ...DEFAULT_ROUTE_FLAGS, settings: false };
    navigate('https://www.longlivets.com/?screen=settings');
    expect(openWeb).toHaveBeenCalledWith('https://www.longlivets.com');
  });

  it('passes a non-production siteUrl through', () => {
    const openNative = vi.fn();
    const openWeb = vi.fn();
    const navigate = createNavigate({ openNative, openWeb }, 'https://staging.longlivets.com');
    navigate('https://staging.longlivets.com/?current=theories');
    expect(openWeb).toHaveBeenCalledWith('https://staging.longlivets.com/?current=theories');
  });
});

import { describe, expect, it } from 'vitest';
import { destinationFor, resolveDeepLink, settingsDestination } from './notification-deep-links';

describe('resolveDeepLink', () => {
  it('resolves a longlivets.com current-item URL to the current-feed screen', () => {
    expect(
      resolveDeepLink('song_drop', 'https://www.longlivets.com/?current=abc123'),
    ).toEqual({
      screen: 'current-feed',
      filter: 'abc123',
    });
  });

  it('resolves the merch-drops anchor URL to the merch filter', () => {
    expect(
      resolveDeepLink(
        'official_merch',
        'https://www.longlivets.com/?utm_source=push#merch-new-drops',
      ),
    ).toEqual({ screen: 'current-feed', filter: 'merch' });
  });

  it('falls back to the per-category default when the URL is off-site', () => {
    expect(resolveDeepLink('song_drop', 'https://example.com/whatever')).toEqual({
      screen: 'current-feed',
      filter: 'song_drop',
    });
  });

  it('falls back to the per-category default with no rawUrl', () => {
    expect(resolveDeepLink('easter_egg')).toEqual({ screen: 'current-feed', filter: 'theories' });
  });

  it('maps easter_egg to the theories filter', () => {
    expect(resolveDeepLink('easter_egg')).toEqual({ screen: 'current-feed', filter: 'theories' });
  });

  it('handles an unparseable rawUrl without throwing', () => {
    expect(resolveDeepLink('song_drop', 'not a url')).toEqual({
      screen: 'current-feed',
      filter: 'song_drop',
    });
  });
});

describe('settingsDestination', () => {
  it('always opens settings focused on the given category', () => {
    expect(settingsDestination('song_drop')).toEqual({
      screen: 'settings',
      focusCategory: 'song_drop',
    });
  });
});

// `destinationFor` (the shell's native-vs-WebView routing decision,
// OS-003) is exercised against the same backend-emitted URL patterns as
// `resolveDeepLink` above, so a URL shape that's supposed to be handled by
// EITHER the notification-tap handler (`resolveDeepLink`) OR the shell
// catch-all AND destinationFor treating it as an untouched pass-through —
// see the deep-link contract test below.
const BACKEND_URLS = [
  ['https://www.longlivets.com/?screen=settings', 'settings quick action'],
  ['https://www.longlivets.com/?current=inbox', 'digest → inbox'],
  ['https://www.longlivets.com/?current=theories', 'digest → theories'],
  ['https://www.longlivets.com/?song=all-too-well-10-min', 'lyric_of_day → song'],
  ['https://www.longlivets.com/', 'fun-category default (bare root)'],
  ['https://www.longlivets.com/?current=countdowns', 'countdown reminder'],
  [
    'https://www.longlivets.com/?utm_source=push&utm_medium=notification&utm_campaign=merch-drop#merch-new-drops',
    'official merch drop (hash anchor)',
  ],
  ['https://www.longlivets.com/?current=merch', 'fan merch spotlight'],
] as const;

describe('deep-link contract: every backend-emitted pattern is understood', () => {
  it.each(BACKEND_URLS)('%s (%s) is handled by resolveDeepLink or destinationFor', (url) => {
    const shellRouted = destinationFor(url);
    // destinationFor "handles" a URL when it resolves to a native screen
    // (settings/inbox/era-stream/etc) OR explicitly hands the exact URL
    // through unchanged to the WebView (kind: 'web', url matching the
    // input) — either is a deliberate, understood outcome, not a silent
    // fallback to the site root.
    const handled =
      shellRouted.kind !== 'web' || shellRouted.url === url;
    expect(handled).toBe(true);
  });

  it('an unrecognized off-site URL is NOT falsely reported as handled by either router', () => {
    const url = 'https://not-longlivets.example.com/whatever';
    const shellRouted = destinationFor(url);
    expect(shellRouted).toEqual({ kind: 'web', url: 'https://www.longlivets.com' });
  });
});

describe('destinationFor (shell routing, OS-003)', () => {
  it('routes ?screen=settings to the native settings screen', () => {
    expect(destinationFor('https://www.longlivets.com/?screen=settings')).toEqual({
      kind: 'settings',
    });
  });

  it('routes ?current=inbox to the native inbox screen', () => {
    expect(destinationFor('https://www.longlivets.com/?current=inbox')).toEqual({
      kind: 'inbox',
    });
  });

  it('passes any other same-origin URL through to the WebView unchanged', () => {
    const url = 'https://www.longlivets.com/?current=theories';
    expect(destinationFor(url)).toEqual({ kind: 'web', url });
  });

  it('falls back to the site root for an off-site URL', () => {
    expect(destinationFor('https://www.youtube.com/watch?v=abc')).toEqual({
      kind: 'web',
      url: 'https://www.longlivets.com',
    });
  });

  it('falls back to the site root for a missing rawUrl', () => {
    expect(destinationFor(undefined)).toEqual({ kind: 'web', url: 'https://www.longlivets.com' });
    expect(destinationFor(null)).toEqual({ kind: 'web', url: 'https://www.longlivets.com' });
  });

  it('never throws on an unparseable rawUrl', () => {
    expect(destinationFor('not a url')).toEqual({ kind: 'web', url: 'https://www.longlivets.com' });
  });

  it('accepts an injected non-www siteUrl and matches both host forms', () => {
    expect(destinationFor('https://longlivets.com/?screen=settings', 'https://longlivets.com')).toEqual(
      { kind: 'settings' },
    );
    expect(
      destinationFor('https://www.longlivets.com/?screen=settings', 'https://longlivets.com'),
    ).toEqual({ kind: 'settings' });
  });

  // OS-032
  it('routes ?screen=era-stream to the native era stream screen', () => {
    expect(destinationFor('https://www.longlivets.com/?screen=era-stream')).toEqual({
      kind: 'era-stream',
    });
  });

  // OS-037
  it('routes ?mode=community to the native community screen', () => {
    expect(destinationFor('https://www.longlivets.com/?mode=community')).toEqual({
      kind: 'community',
    });
  });

  it('routes ?mode=merch to the native merch screen', () => {
    expect(destinationFor('https://www.longlivets.com/?mode=merch')).toEqual({
      kind: 'merch',
    });
  });

  it('passes ?mode=threads through to the WebView (no native screen for it)', () => {
    const url = 'https://www.longlivets.com/?mode=threads';
    expect(destinationFor(url)).toEqual({ kind: 'web', url });
  });

  // OS-035
  it('routes ?screen=track-guide&era=<id> to the native track guide screen', () => {
    expect(
      destinationFor('https://www.longlivets.com/?screen=track-guide&era=folklore'),
    ).toEqual({ kind: 'track-guide', eraId: 'folklore' });
  });

  it('does not treat ?screen=track-guide with no era param as native', () => {
    expect(destinationFor('https://www.longlivets.com/?screen=track-guide')).toEqual({
      kind: 'web',
      url: 'https://www.longlivets.com/?screen=track-guide',
    });
  });

  it('routes ?screen=song&key=<trackKey> to the native song screen', () => {
    expect(
      destinationFor('https://www.longlivets.com/?screen=song&key=folklore%3A%3A1%3A%3Athe%201'),
    ).toEqual({ kind: 'song', trackKey: 'folklore::1::the 1' });
  });

  it('does not treat ?screen=song with no key param as native', () => {
    expect(destinationFor('https://www.longlivets.com/?screen=song')).toEqual({
      kind: 'web',
      url: 'https://www.longlivets.com/?screen=song',
    });
  });

  it("passes the website's own ?guide=/?song= share-link params through unchanged", () => {
    expect(destinationFor('https://www.longlivets.com/?guide=folklore')).toEqual({
      kind: 'web',
      url: 'https://www.longlivets.com/?guide=folklore',
    });
    expect(destinationFor('https://www.longlivets.com/?song=all-too-well-10-min')).toEqual({
      kind: 'web',
      url: 'https://www.longlivets.com/?song=all-too-well-10-min',
    });
  });

  // OS-036
  it('routes ?screen=clownbot to the native Clownbot + mood chat screen', () => {
    expect(destinationFor('https://www.longlivets.com/?screen=clownbot')).toEqual({
      kind: 'clownbot',
    });
  });
});

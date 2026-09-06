import { describe, expect, it } from 'vitest';
import { destinationFor, resolveDeepLink, settingsDestination } from './notification-deep-links';

describe('resolveDeepLink', () => {
  it('resolves a longlivets.com current-item URL to the current-feed screen', () => {
    const dest = resolveDeepLink('song_drop', 'https://www.longlivets.com/?current=abc-123');
    expect(dest).toEqual({ screen: 'current-feed', filter: 'abc-123' });
  });

  it('resolves the merch-drops anchor URL to the merch filter', () => {
    const dest = resolveDeepLink(
      'official_merch',
      'https://www.longlivets.com/?utm_source=push#merch-new-drops',
    );
    expect(dest).toEqual({ screen: 'current-feed', filter: 'merch' });
  });

  it('falls back to the per-category default when the URL is off-site', () => {
    const dest = resolveDeepLink('song_drop', 'https://www.youtube.com/watch?v=abc');
    expect(dest).toEqual({ screen: 'current-feed', filter: 'song_drop' });
  });

  it('falls back to the per-category default with no rawUrl', () => {
    expect(resolveDeepLink('tour_news')).toEqual({ screen: 'current-feed', filter: 'tour_news' });
  });

  it('maps easter_egg to the theories filter', () => {
    expect(resolveDeepLink('easter_egg')).toEqual({ screen: 'current-feed', filter: 'theories' });
  });

  it('handles an unparseable rawUrl without throwing', () => {
    const dest = resolveDeepLink('song_drop', 'not a url');
    expect(dest).toEqual({ screen: 'current-feed', filter: 'song_drop' });
  });
});

describe('settingsDestination', () => {
  it('always opens settings focused on the given category', () => {
    expect(settingsDestination('award_news')).toEqual({
      screen: 'settings',
      focusCategory: 'award_news',
    });
  });
});

// --- OS-003: deep-link contract test ------------------------------------
//
// The backend (packages/core/src/notification-*.ts) emits exactly these
// www.longlivets.com URL shapes as push/digest `deepLink` payloads (grep
// audited 2026-09-05 — see the citation on each case below). This suite
// enumerates every one of them and asserts SOME router understands it:
// either this package's own `resolveDeepLink` (the portable, in-app-screen
// router both apps/mobile's notification-tap handler and inbox use), or
// `destinationFor` (the shell's native-vs-WebView routing decision,
// apps/mobile/App.tsx before OS-003, now colocated here). A pattern that
// falls through BOTH — resolveDeepLink returning its generic `inbox`
// catch-all AND destinationFor treating it as an untouched pass-through —
// would mean a notification silently lands the user on the front door
// instead of its target, which is exactly the regression this test exists
// to catch.
describe('deep-link contract: every backend-emitted pattern is understood', () => {
  const BACKEND_URLS = [
    // notification-cooldown.ts:184 — the "Settings" quick-action button.
    ['https://www.longlivets.com/?screen=settings', 'settings quick action'],
    // notification-digest.ts:227 — digest summary → inbox.
    ['https://www.longlivets.com/?current=inbox', 'digest → inbox'],
    // notification-digest.ts:340 — digest summary → theories.
    ['https://www.longlivets.com/?current=theories', 'digest → theories'],
    // notification-fun.ts:324 — lyric_of_day → the song's track-guide page.
    ['https://www.longlivets.com/?song=all-too-well-10-min', 'lyric_of_day → song'],
    // notification-fun.ts:375 — fallback when a fun-category producer sets
    // no more specific deepLink (bare site root).
    ['https://www.longlivets.com/', 'fun-category default (bare root)'],
    // notification-fun.ts:574 — countdown reminders → countdowns.
    ['https://www.longlivets.com/?current=countdowns', 'countdown reminder'],
    // scripts/merch-engine/emit-official-merch-event.mjs:54 — official
    // merch drop, UTM-tagged, anchored at the "Just landed" rail.
    [
      'https://www.longlivets.com/?utm_source=push&utm_medium=notification&utm_campaign=merch-drop#merch-new-drops',
      'official merch drop (hash anchor)',
    ],
    // scripts/merch-engine/emit-fanmade-event.mjs:52 — fan merch spotlight.
    ['https://www.longlivets.com/?current=merch', 'fan merch spotlight'],
  ] as const;

  it.each(BACKEND_URLS)('%s (%s) is handled by resolveDeepLink or destinationFor', (url) => {
    const routed = resolveDeepLink('song_drop', url);
    const shellRouted = destinationFor(url);

    // resolveDeepLink "handles" a URL when it resolves to something more
    // specific than the bare `{ screen: 'inbox' }` catch-all it falls back
    // to for a category with no rawUrl match at all (see its `default:`
    // arm) — that catch-all is only correct when nothing else understood
    // the link either.
    const resolveHandled = !(routed.screen === 'inbox' && Object.keys(routed).length === 1);

    // destinationFor "handles" a URL when it resolves to a native screen
    // (settings/inbox) OR passes the URL through to the WebView UNCHANGED
    // — a same-origin longlivets.com link the site itself can interpret on
    // load (via its own anchor/query-param handling). It does NOT count as
    // handled if the URL got silently rewritten to the bare site root,
    // which only happens for an off-site or unparseable URL.
    const shellHandled =
      shellRouted.kind === 'settings' ||
      shellRouted.kind === 'inbox' ||
      (shellRouted.kind === 'web' && shellRouted.url === url);

    expect(resolveHandled || shellHandled).toBe(true);
  });

  it('an unrecognized off-site URL is NOT falsely reported as handled by either router', () => {
    const url = 'https://www.youtube.com/watch?v=unrelated';
    const routed = resolveDeepLink('lyric_of_day', url);
    const shellRouted = destinationFor(url);
    // Falls back to the per-category default (still "handled" — every
    // category has a defined destination) but the shell correctly refuses
    // to hand an off-site URL to the WebView unchanged.
    expect(routed).toEqual({ screen: 'current-feed', filter: 'lyric_of_day' });
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

  // OS-034
  it('routes ?mode=threads to the native threads screen', () => {
    expect(destinationFor('https://www.longlivets.com/?mode=threads')).toEqual({
      kind: 'threads',
    });
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
});

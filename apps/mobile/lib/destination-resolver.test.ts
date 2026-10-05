import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveTrackKey, setTracksRawProvider, trackKey } from '@swift2/experience';
import { applyDeepLink, type DeepLinkActions, type DeepLinkQueries } from '../dom/bridge/deep-link-apply';
import { registerRoutes, resetRoutesForTests, isNativeRoute as isHostRoute } from '../dom/slots/routes-instance';
import { createUiDeps } from './ui-deps';
import { resolveDestination } from './destination-resolver';
import { resolveTapPath } from './notification-tap-queue';

afterEach(resetRoutesForTests);

setTracksRawProvider({ fearless: [{ title: 'Fearless', note: 'n', trackNumber: 1 }] });
const KEY = trackKey('fearless', { title: 'Fearless', trackNumber: 1 });
const KEY_Q = encodeURIComponent(KEY);

const SITE = 'https://www.longlivets.com';
const resolve = (l: string) => resolveDestination(l, { isHostRoute });

// Every deepLink shape the backend emits (packages/core notification-*.ts, send-test-push, share links) plus the
// legacy native-screen query forms destinationFor still understands.
const cases: [string, string, 'dom' | 'native'][] = [
  [`${SITE}/`, '/', 'dom'],
  [`${SITE}/?screen=settings`, '/settings', 'dom'],
  [`${SITE}/?current=inbox`, '/inbox', 'dom'],
  [`${SITE}/?current=countdowns`, '/', 'dom'],
  [`${SITE}/?current=theories`, '/', 'dom'],
  [`${SITE}/?current=merch`, '/?mode=merch', 'dom'],
  [`${SITE}/?song=hello-world`, '/', 'dom'],
  [`${SITE}/?song=${KEY_Q}`, `/?song=${KEY_Q}`, 'dom'],
  [`${SITE}/?moment=some-moment`, '/?moment=some-moment', 'dom'],
  [`${SITE}/?item=abc`, '/?item=abc', 'dom'],
  [`${SITE}/?era=debut`, '/?era=debut', 'dom'],
  [`${SITE}/?mode=threads`, '/?mode=threads', 'dom'],
  [`${SITE}/?screen=era-stream`, '/', 'dom'],
  [`${SITE}/?screen=clownbot`, '/', 'dom'],
  [`${SITE}/?screen=track-guide&era=fearless`, '/?guide=fearless', 'dom'],
  [`${SITE}/?screen=song&key=${KEY_Q}`, `/?song=${KEY_Q}`, 'dom'],
  [`${SITE}/?screen=song&key=slug-only`, '/', 'dom'],
  [`${SITE}/#merch-new-drops`, '/#merch-new-drops', 'dom'],
  [`${SITE}/settings/notifications`, '/settings/notifications', 'dom'],
  [`${SITE}/inbox`, '/inbox', 'dom'],
  [`${SITE}/privacy`, '/privacy', 'dom'],
  ['/?screen=settings', '/settings', 'dom'],
  ['/terms', '/terms', 'dom'],
  [`${SITE}/vault`, '/vault', 'native'],
];

describe('resolveDestination', () => {
  it.each(cases)('%s -> %s (%s)', (link, path, kind) => {
    expect(resolve(link)).toEqual({ kind, path });
  });

  it('a registered host route is native and wins over the DOM table', () => {
    registerRoutes({ slice: 'test', nativeRoutes: [{ id: 'test:native', match: '/test-native' }] });
    expect(resolve('/test-native?x=1')).toEqual({ kind: 'native', path: '/test-native?x=1' });
  });

  it('is idempotent: a canonical path resolves to itself', () => {
    for (const [link] of cases) {
      const once = resolve(link);
      expect(resolve(once.path)).toEqual(once);
    }
  });

  it('an unparseable link falls to the reader root, never throws', () => {
    expect(resolveDestination('http://[', { isHostRoute, siteUrl: 'not a url' })).toEqual({ kind: 'dom', path: '/' });
  });
});

describe('real predicate + presenter: no backend link queues forever', () => {
  // The presenter accepts only registered host routes (none ship today); the bridge handler predicate is the REAL
  // createUiDeps one, never a fake.
  it.each(cases.filter(([, , k]) => k === 'dom'))('%s is a DOM route for the bridge predicate, presenter untouched', (link) => {
    const present = vi.fn();
    const deps = createUiDeps({
      linking: { openURL: vi.fn() },
      share: { share: vi.fn() },
      platformOS: 'ios',
      log: vi.fn(),
      getPresenter: () => present,
    });
    const rel = resolveTapPath(link) ?? link;
    expect(deps.isNativeRoute(rel as never)).toBe(false);
    expect(present).not.toHaveBeenCalled();
  });

  it('every queue-accepted backend link resolves to a destination the tap target can act on', () => {
    for (const [link] of cases) {
      const rel = resolveTapPath(link);
      if (rel === null) continue;
      const d = resolve(rel);
      expect(['dom', 'native']).toContain(d.kind);
      expect(d.path.startsWith('/')).toBe(true);
    }
  });
});

describe('origin handling', () => {
  it.each(['https://evil.com/?screen=settings', 'http://www.longlivets.com/inbox', 'https://www.longlivets.com:8443/inbox', 'https://user@www.longlivets.com/inbox', '//evil.com/inbox', 'https://longlivets.com.evil.com/settings', 'javascript:alert(1)'])(
    '%s is not a local destination: the front door, never interpreted',
    (link) => expect(resolve(link)).toEqual({ kind: 'dom', path: '/' }),
  );
  it('bare longlivets.com is local', () => expect(resolve('https://longlivets.com/?screen=settings')).toEqual({ kind: 'dom', path: '/settings' }));
});

describe('resolver agrees with the real applier (applyDeepLink + resolveTrackKey)', () => {
  const actions = () => Object.fromEntries(['goHome', 'setEra', 'setMode', 'openThread', 'openItem', 'openVideo', 'openSong', 'openTrackGuide', 'openTheoryGuide', 'closeItem', 'closeInbox', 'closeSettings', 'closeTrackGuide', 'closeTheoryGuide', 'setSearchOpen', 'setSelectorOpen'].map((k) => [k, vi.fn()])) as unknown as Record<keyof DeepLinkActions, ReturnType<typeof vi.fn>>;
  const queries: DeepLinkQueries = {
    threadIds: [],
    contentItemId: (id) => (id === 'abc' ? 'abc' : null),
    isEraId: (id) => ['fearless', 'debut'].includes(id),
    eraHasVideoSlug: () => false,
    findEraForVideoSlug: () => null,
    eraOfTrackKey: (k) => resolveTrackKey(k)?.eraId ?? null,
  };
  const reader = cases.filter(([, , k]) => k === 'dom').map(([l]) => resolve(l)).filter((d) => new URL(d.path, SITE).pathname === '/');

  it('every legacy translation the producers can emit is honoured by the applier (state changes, never ok:false)', () => {
    for (const link of [`${SITE}/?screen=track-guide&era=fearless`, `${SITE}/?screen=song&key=${KEY_Q}`, `${SITE}/?song=${KEY_Q}`, `${SITE}/?song=hello-world`, `${SITE}/?current=countdowns`, `${SITE}/?current=merch`, `${SITE}/?screen=era-stream`]) {
      const a = actions();
      const search = new URL(resolve(link).path, SITE).search;
      expect(applyDeepLink(search, queries, a as unknown as DeepLinkActions), link).toBe(true);
    }
  });

  it('translated forms reach the matching reader action', () => {
    const a = actions();
    applyDeepLink(new URL(resolve(`${SITE}/?screen=song&key=${KEY_Q}`).path, SITE).search, queries, a as unknown as DeepLinkActions);
    expect(a.openSong).toHaveBeenCalledWith('fearless', KEY);
    const b = actions();
    applyDeepLink(new URL(resolve(`${SITE}/?screen=track-guide&era=fearless`).path, SITE).search, queries, b as unknown as DeepLinkActions);
    expect(b.openTrackGuide).toHaveBeenCalledWith('fearless');
  });

  it('reader destinations exist for the table', () => expect(reader.length).toBeGreaterThan(5));
});

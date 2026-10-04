import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerRoutes, resetRoutesForTests, isNativeRoute as isHostRoute } from '../dom/slots/routes-instance';
import { createUiDeps } from './ui-deps';
import { resolveDestination } from './destination-resolver';
import { resolveTapPath } from './notification-tap-queue';

afterEach(resetRoutesForTests);

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
  [`${SITE}/?moment=some-moment`, '/?moment=some-moment', 'dom'],
  [`${SITE}/?item=abc`, '/?item=abc', 'dom'],
  [`${SITE}/?era=debut`, '/?era=debut', 'dom'],
  [`${SITE}/?mode=threads`, '/?mode=threads', 'dom'],
  [`${SITE}/?screen=era-stream`, '/', 'dom'],
  [`${SITE}/?screen=clownbot`, '/', 'dom'],
  [`${SITE}/?screen=track-guide&era=fearless`, '/', 'dom'],
  [`${SITE}/?screen=song&key=k1`, '/', 'dom'],
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

import { describe, expect, it } from 'vitest';
import { createNativeRoutePresenter } from '../../lib/dom-host-handlers';
import { isNativeRoute, nativeRoutes } from './routes';

describe('host native routes (real registry + real presenter)', () => {
  const presenter = () => createNativeRoutePresenter({ isNativeRoute, now: () => 1 });

  it('registers exactly the screen NativeOverlayHost still renders', () => {
    expect(nativeRoutes().map((r) => r.match).sort()).toEqual(['/inbox', '/settings/about']);
  });

  it.each(['/inbox', '/settings/about'])('%s is presented', (path) => {
    expect(isNativeRoute(path)).toBe(true);
    expect(presenter().presentNativeRoute(path)).toBe('applied');
  });

  it.each(['/?mode=threads', '/?screen=song&key=x', '/settings', '/settings/notifications', '/privacy'])('%s is rejected', (path) => {
    expect(isNativeRoute(path)).toBe(false);
    expect(presenter().presentNativeRoute(path)).toBe('rejected');
  });
});

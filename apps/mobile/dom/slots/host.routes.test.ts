import { describe, expect, it } from 'vitest';
import { createNativeRoutePresenter } from '../../lib/dom-host-handlers';
import { isNativeRoute, nativeRoutes } from './routes';

describe('host native routes (real registry + real presenter)', () => {
  const presenter = () => createNativeRoutePresenter({ isNativeRoute, now: () => 1 });

  it('registers exactly the two screens NativeOverlayHost renders', () => {
    expect(nativeRoutes().map((r) => r.match).sort()).toEqual(['/inbox', '/settings/notifications']);
  });

  it.each(['/inbox', '/settings/notifications'])('%s is presented', (path) => {
    expect(isNativeRoute(path)).toBe(true);
    expect(presenter().presentNativeRoute(path)).toBe('applied');
  });

  it.each(['/?mode=threads', '/?screen=song&key=x', '/settings', '/privacy'])('%s is rejected', (path) => {
    expect(isNativeRoute(path)).toBe(false);
    expect(presenter().presentNativeRoute(path)).toBe('rejected');
  });
});

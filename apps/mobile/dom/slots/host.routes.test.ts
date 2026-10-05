import { describe, expect, it } from 'vitest';
import { createNativeRoutePresenter } from '../../lib/dom-host-handlers';
import { isNativeRoute, nativeRoutes } from './routes';

describe('host native routes (real registry + real presenter)', () => {
  const presenter = () => createNativeRoutePresenter({ isNativeRoute, now: () => 1 });

  it('registers no native screen: every user-facing surface is the shared DOM UI', () => {
    expect(nativeRoutes()).toEqual([]);
  });

  it.each(['/inbox', '/settings/about', '/?mode=threads', '/?screen=song&key=x', '/settings', '/settings/notifications', '/privacy'])('%s is rejected', (path) => {
    expect(isNativeRoute(path)).toBe(false);
    expect(presenter().presentNativeRoute(path)).toBe('rejected');
  });
});

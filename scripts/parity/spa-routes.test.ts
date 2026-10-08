import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without type declarations
import { SPA_ROUTES, isSpaRoute } from './spa-routes.mjs';

describe('side-b SPA route allow-list', () => {
  it('serves the real app routes', () => {
    for (const p of ['/settings', '/settings/notifications', '/privacy', '/terms', '/support']) expect(isSpaRoute(p)).toBe(true);
    expect(SPA_ROUTES).toHaveLength(5);
  });

  it('an unknown route is not a SPA route (the server answers 404)', () => {
    for (const p of ['/nope', '/settings/other', '/settings/', '/privacy/x', '/content/x', '/']) expect(isSpaRoute(p)).toBe(false);
  });
});

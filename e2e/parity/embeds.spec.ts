import { openAOnlyRoute, test, expect } from './helpers';
import { EMBED_ROUTES } from './routes-embeds';
import type { Side } from './env';

// The iframe src each side mounts after the facade is opened: web embeds the provider directly; the app frames the site's
// /embed/<provider>/... wrapper on its canonical origin (device error 153, #4954 / #5025). No provider is contacted (stubbed).
for (const route of EMBED_ROUTES) {
  for (const side of ['a', 'b'] as const satisfies readonly Side[]) {
    test(`embed src (${side}): ${route.name}`, async ({ pages }) => {
      const page = pages[side];
      await openAOnlyRoute(page, route, side);
      const frames = page.locator('iframe');
      await expect(frames).toHaveCount(1);
      expect(await frames.first().getAttribute('src')).toMatch(route.src[side]);
    });
  }
}

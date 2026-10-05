import { expect, openRoute, ROUTES, test } from './helpers';

// #5023: on iPad widths (Tailwind md, 768-1279) the TopBar mode tabs used to
// overlap the era-menu button, so taps landed on the tabs. The button's centre
// must hit-test back to the button (or a descendant) at every width in range.
const route = ROUTES[0];
const WIDTHS = [768, 834, 1024, 1194, 1279];

for (const side of ['a', 'b'] as const) {
  for (const width of WIDTHS) {
    test(`side ${side} @${width}: the era-menu button is not covered`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1194 });
      await openRoute(page, side, route);
      const button = page.getByRole('button', { name: /open the eras menu/i });
      await expect(button).toBeVisible();
      const covered = await button.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hit === null || !el.contains(hit);
      });
      expect(covered).toBe(false);
    });
  }
}

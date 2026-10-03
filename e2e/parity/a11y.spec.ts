import { bOnly, keyOf, newViolations, readBaseline, scan, UPDATE, writeBaseline } from './a11y';
import { expect, openRoute, ROUTES, test } from './helpers';

// axe (wcag2a/wcag2aa) on both sides of each fixture route. Fails only on
// serious/critical violations absent from the committed baseline. Serial per
// project: A11Y_UPDATE=1 read-modify-writes that project's baseline file.
test.describe.configure({ mode: 'serial' });

for (const route of ROUTES) {
  test(`a11y: ${route.name}`, async ({ page }, testInfo) => {
    const project = testInfo.project.name;
    const found = {} as Record<'a' | 'b', Awaited<ReturnType<typeof scan>>>;
    for (const side of ['a', 'b'] as const) {
      await openRoute(page, side, route);
      found[side] = await scan(page);
    }

    const only = bOnly(found.a, found.b);
    if (only.length > 0) {
      console.log(`a11y b-only (${project} ${route.name}): ${only.join('; ')}`);
      testInfo.annotations.push({ type: 'a11y-b-only', description: only.join('; ') });
    }

    if (UPDATE) {
      for (const side of ['a', 'b'] as const) writeBaseline(project, keyOf(side, route), found[side]);
      return;
    }
    const baseline = readBaseline(project);
    for (const side of ['a', 'b'] as const) {
      const base = baseline[keyOf(side, route)];
      expect(base, `baseline entry ${keyOf(side, route)} exists`).toBeDefined();
      expect.soft(newViolations(found[side], base ?? []), `new serious/critical on side ${side}`).toEqual([]);
    }
  });
}

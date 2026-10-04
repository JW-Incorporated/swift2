// One UI W1-E: which sides a side-a-only route renders on. Pure (no Playwright import) so it unit-tests without a browser.
// 'a' = web build only (default, today's behaviour); 'both' = web build and the app DOM bundle (side b), compared a-vs-b.
export type Sides = 'a' | 'both';

export interface Sided {
  readonly name: string;
  readonly sides?: Sides;
}

/** Routes a slice D has flipped to both sides; everything else stays a-only. */
export const bothSidesRoutes = <T extends Sided>(routes: readonly T[]): T[] => routes.filter((r) => r.sides === 'both');

/** Committed baseline file names for a route's side-b captures (root clip, whole viewport with real insets). */
export const bBaselineNames = (route: Sided): { root: string; viewport: string } => ({
  root: `b-${route.name}.png`,
  viewport: `b-${route.name}-viewport.png`,
});

/** The captures a flipped route adds, in run order. Dry-run of the b-side plumbing: no browser, no files. */
export function planBSide(routes: readonly Sided[]): { route: string; compare: string; baselines: string[] }[] {
  return bothSidesRoutes(routes).map((r) => {
    const names = bBaselineNames(r);
    return { route: r.name, compare: `a vs b viewport: ${r.name}`, baselines: [names.root, names.viewport] };
  });
}

/** Throws when a 'both' route's b baselines would overwrite a base route's (b-home*, b-item*) or another flipped route's. */
export function assertNoBaselineCollisions(base: readonly Sided[], routes: readonly Sided[]): void {
  const owner = new Map<string, string>();
  for (const r of base) for (const f of Object.values(bBaselineNames(r))) owner.set(f, r.name);
  for (const r of bothSidesRoutes(routes)) {
    for (const f of Object.values(bBaselineNames(r))) {
      const prior = owner.get(f);
      if (prior !== undefined) throw new Error(`parity: route "${r.name}" b baseline ${f} collides with route "${prior}"`);
      owner.set(f, r.name);
    }
  }
}

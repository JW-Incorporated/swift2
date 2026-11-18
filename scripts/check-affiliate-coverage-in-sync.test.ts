import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isCoverageInSync } from './check-affiliate-coverage-in-sync.mjs';
import { buildCoverage, formatCoverage, parseCoverage } from './merch-engine/affiliate-coverage.mjs';

const products = [
  {
    item: 'Official tee',
    retailer: 'store.taylorswift.com',
    url: 'https://store.taylorswift.com/tee',
    category: 'official-store' as const,
  },
  {
    item: 'Delisted hoodie',
    retailer: 'store.taylorswift.com',
    url: 'https://store.taylorswift.com/hoodie',
    category: 'official-store' as const,
  },
];

const resolveNetwork = () => ({ network: 'none' as const });
const render = (rows: typeof products) =>
  formatCoverage(buildCoverage(rows, { resolveNetwork, awinApplyRetailers: new Set<string>() }));

describe('affiliate coverage freshness gate', () => {
  it('accepts regenerated output and rejects deliberate drift', () => {
    const generated = '<!-- GENERATED -->\n# Affiliate coverage\n';
    expect(isCoverageInSync(generated, generated)).toBe(true);
    expect(isCoverageInSync(generated, `${generated}\nmanual drift\n`)).toBe(false);
  });

  // Regression, issue #6946: the 2026-11-17 Vault Run dropped one delisted
  // official-store product from the catalogue (584 -> 583) and committed the
  // stale 584-row report, which turned the next run's vitest gate red. The
  // gate must flag a catalogue change whose report was not regenerated.
  it('rejects a report left behind by a catalogue that shrank', () => {
    const committed = render(products);
    const regenerated = render(products.slice(0, 1));

    expect(parseCoverage(committed).summary.total).toBe(2);
    expect(parseCoverage(regenerated).summary.total).toBe(1);
    expect(isCoverageInSync(committed, regenerated)).toBe(false);
  });

  it('rejects a report left behind by a catalogue that grew', () => {
    expect(isCoverageInSync(render(products.slice(0, 1)), render(products))).toBe(false);
  });

  // The fix for #6946: the generator is part of `sync:content`, so every lane
  // that edits merch seed data and syncs before committing regenerates the
  // report in the same commit. Without this, the only thing that regenerated
  // it was merch-awin-sync.yml, and CI's content-only path filter skips the
  // `check:affiliate-coverage` gate on seed/docs-only PRs.
  it('regenerates the report as the last step of sync:content', () => {
    const { scripts } = JSON.parse(readFileSync('package.json', 'utf8'));
    const steps = scripts['sync:content'].split(' && ').map((s: string) => s.trim());

    expect(steps.at(-1)).toBe('tsx scripts/merch-engine/affiliate-coverage.mjs');
    // It imports apps/web/lib/longlive/merch.ts, so the merch vault generator
    // must already have run when it does.
    expect(steps.indexOf('node scripts/sync-longlive-merch.mjs')).toBeGreaterThan(-1);
    expect(steps.indexOf('node scripts/sync-longlive-merch.mjs')).toBeLessThan(steps.length - 1);
  });
});

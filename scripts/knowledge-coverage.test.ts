import { describe, expect, it } from 'vitest';
import { buildCoverageReport } from './knowledge-coverage.mjs';

const eggLedgerRows = [
  { id: 'egg:debut:a', era_id: 'debut' },
  { id: 'egg:debut:b', era_id: 'debut' },
  { id: 'egg:fearless:c', era_id: 'fearless' },
];

describe('buildCoverageReport — technique table not reachable (no DB)', () => {
  it('says so honestly, without rendering a fabricated matrix', () => {
    const report = buildCoverageReport({ techniques: null, eggLedgerRows, generatedAt: '2026-08-23T00:00:00Z' });
    expect(report).toContain('Not checked this run');
    expect(report).not.toMatch(/\| Technique \|/);
  });
});

describe('buildCoverageReport — technique table empty (Stage 4 default state)', () => {
  it('reports "no techniques seeded yet" honestly instead of an empty/broken matrix', () => {
    const report = buildCoverageReport({ techniques: [], eggLedgerRows, generatedAt: '2026-08-23T00:00:00Z' });
    expect(report).toContain('No techniques seeded yet');
    expect(report).not.toMatch(/\| Technique \|/);
  });

  it('still renders the egg-ledger-by-era reference table from real data', () => {
    const report = buildCoverageReport({ techniques: [], eggLedgerRows, generatedAt: '2026-08-23T00:00:00Z' });
    expect(report).toContain('| debut | 2 |');
    expect(report).toContain('| fearless | 1 |');
  });

  it('handles a completely empty egg_ledger without crashing', () => {
    const report = buildCoverageReport({ techniques: [], eggLedgerRows: [], generatedAt: '2026-08-23T00:00:00Z' });
    expect(report).toContain('No confirmed easter eggs in `egg_ledger` yet.');
  });
});

describe('buildCoverageReport — technique table populated', () => {
  const techniques = [
    { key: 'website_egg', label: 'Website egg', example_ids: ['egg:debut:a', 'egg:debut:b'] },
    { key: 'wardrobe_signal', label: 'Wardrobe signal', example_ids: ['egg:fearless:c'] },
  ];

  it('builds a real technique x era matrix and flags thin cells', () => {
    const report = buildCoverageReport({ techniques, eggLedgerRows, generatedAt: '2026-08-23T00:00:00Z' });
    expect(report).toMatch(/\| Technique \|/);
    expect(report).toContain('Website egg');
    expect(report).toContain('⚠');
  });

  it('flags techniques with fewer than 2 grounded examples', () => {
    const report = buildCoverageReport({ techniques, eggLedgerRows, generatedAt: '2026-08-23T00:00:00Z' });
    expect(report).toContain('**Techniques with <2 grounded examples total:** wardrobe_signal');
  });

  it('reports full coverage when every technique has >=2 examples', () => {
    const fullyCovered = [{ key: 'website_egg', label: 'Website egg', example_ids: ['egg:debut:a', 'egg:debut:b'] }];
    const report = buildCoverageReport({ techniques: fullyCovered, eggLedgerRows, generatedAt: '2026-08-23T00:00:00Z' });
    expect(report).toContain('All techniques have >=2 grounded examples.');
  });
});

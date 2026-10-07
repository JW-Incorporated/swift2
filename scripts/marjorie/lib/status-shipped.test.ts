import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { NOISE_RULES, noiseRuleFor, renderShipped, selectShipped, toPr } from './status-shipped.mjs';

const NOW = Date.parse('2026-09-30T20:00:00Z');
const pr = (over: Record<string, unknown> = {}) => ({
  number: 1, title: 'feat(web): a real change', url: 'https://github.com/o/r/pull/1', author: 'sffan15-sys', branch: 'feat/x',
  labels: [] as string[], mergedAt: '2026-09-30T18:00:00Z', updatedAt: '2026-09-30T18:00:00Z', draft: false, ...over,
});

// One row per noise rule: [rule id, a PR it must filter]. Every rule has a positive case,
// so a rule that stops matching its real-world shape fails here.
const NOISE: Array<[string, Record<string, unknown>]> = [
  ['dependabot-author', { author: 'dependabot[bot]' }],
  ['dependabot-branch', { branch: 'dependabot/npm_and_yarn/next-16.3.6' }],
  ['deps-title', { title: 'chore(deps-dev): bump jsdom from 26.1.0 to 30.1.1' }],
  ['growth-snapshot', { title: 'growth-snapshot: 2026-09-30T16:45:18Z' }],
  ['cie-scan', { title: 'cie: scan report 2026-09-29' }],
  ['social-ledger-fold', { title: 'social-feedback: fold ledger into main' }],
  ['social-poster-run', { title: 'social-poster: queue state 2026-09-22 — ⛔ A POST FAILED' }],
  ['social-event-status', { title: 'social-event-status: 2026-09-30T10:00:00Z' }],
  ['social-draft', { title: 'Tree: daily social draft — 2026-09-26', labels: ['tree', 'social-draft'] }],
  ['output-sampling', { title: 'routine-output-sampling: 2026-09-28' }],
  ['ha-ledger', { title: 'Human action #87: decide on the ownership backlog' }],
  ['ha-ledger', { title: 'docs(human-actions): close #63' }],
  ['ha-ledger', { title: 'Close HA #12 — owner replied on the status page' }],
  ['ha-ledger', { title: 'HA #86: SOCIAL_POSTER_PAT can\'t trigger GitHub Actions' }],
  ['marjorie-chase', { title: 'Marjorie: chase decisions #4559' }],
  ['merch-automation', { title: 'chore(merch): refresh weekly revenue report' }],
  ['merch-automation', { title: 'feat(merch): author official-store sync plan (run 35733459425)', branch: 'merch-official-sync/35733459425' }],
];

// Real work that shares words with the noise patterns and must NOT be hidden.
const REAL: Array<Record<string, unknown>> = [
  { title: 'Automate weekly Facebook group export (HA #70)' },
  { title: 'policy(HA#87, #4546): raise work-ownership budgets' },
  { title: 'vault: 2026-09-29 — 3 lanes', author: 'claude[bot]' },
  { title: 'Tree: weekly plan — week of 2026-09-28', author: 'claude[bot]' },
  { title: 'fix(social): per-era photo tagging + Wikimedia sourcing to fix reuse' },
  { title: 'fix(ci): raise plan-recheck-marjorie max_turns 40 -> 70' },
  { title: 'feat(deps): add a dependency graph page' },
];

describe('noise filter', () => {
  it.each(NOISE)('filters %s', (id, over) => {
    expect(noiseRuleFor(pr(over))?.id).toBe(id);
  });
  it('covers every rule in the list', () => {
    const covered = new Set(NOISE.map(([id]) => id));
    for (const rule of NOISE_RULES) expect(covered.has(rule.id), `no test case for rule ${rule.id}`).toBe(true);
  });
  it.each(REAL)('keeps real work: %o', (over) => {
    expect(noiseRuleFor(pr(over))).toBeNull();
  });
  it('has unique rule ids, each with a stated reason', () => {
    expect(new Set(NOISE_RULES.map((r: { id: string }) => r.id)).size).toBe(NOISE_RULES.length);
    for (const rule of NOISE_RULES) expect(rule.why.length).toBeGreaterThan(3);
  });
});

describe('selectShipped', () => {
  it('keeps only merged PRs inside 7 days, newest first, noise removed', () => {
    const rows = [
      pr({ number: 1, mergedAt: '2026-09-30T18:00:00Z' }),
      pr({ number: 2, mergedAt: '2026-09-23T19:59:59Z' }),
      pr({ number: 3, mergedAt: '2026-09-23T20:00:01Z' }),
      pr({ number: 4, mergedAt: null }),
      pr({ number: 5, title: 'growth-snapshot: x' }),
      pr({ number: 6, mergedAt: '2026-10-01T00:00:00Z' }),
    ];
    expect(selectShipped(rows, NOW).map((p: { number: number }) => p.number)).toEqual([1, 3]);
  });
});

describe('renderShipped', () => {
  it('groups by Pacific day with plain linked titles', () => {
    const rows = [
      pr({ number: 7, title: 'late evening change (#7)', mergedAt: '2026-09-30T06:30:00Z' }),
      pr({ number: 8, title: 'afternoon change', mergedAt: '2026-09-29T21:00:00Z', url: 'https://github.com/o/r/pull/8' }),
    ];
    const out = renderShipped(rows, { hidden: 3 });
    expect(out).toContain('**Tue, Sep 29**');
    expect(out.indexOf('**Tue, Sep 29**')).toBeLessThan(out.indexOf('afternoon change'));
    expect(out).toContain('- [afternoon change](https://github.com/o/r/pull/8)');
    expect(out).not.toContain('(#7)]');
    expect(out).toContain('3 housekeeping PRs filtered');
  });
  it('says so when nothing shipped and trims past maxLines', () => {
    expect(renderShipped([])).toContain('Nothing merged');
    const many = Array.from({ length: 10 }, (_, i) => pr({ number: i, title: `change ${i}` }));
    expect(renderShipped(many, { maxLines: 4 })).toContain('6 older not shown');
  });
});

describe('toPr', () => {
  it('normalizes a REST pull row', () => {
    expect(toPr({ number: 5, title: '  a\n b ', html_url: 'u', user: { login: 'x' }, head: { ref: 'br' }, labels: [{ name: 'l' }], merged_at: 'm', updated_at: 'u2', draft: true }))
      .toEqual({ number: 5, title: 'a b', url: 'u', author: 'x', branch: 'br', labels: ['l'], mergedAt: 'm', updatedAt: 'u2', draft: true, body: '', fork: false });
  });
});

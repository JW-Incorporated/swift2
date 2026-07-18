import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { buildBrief, extractField, extractOptions, fetchGrowthSnapshot, formatGrowthLine, todayLA } from './assemble-brief.mjs';

const NOW = new Date('2026-07-12T13:00:00Z').getTime();

const formBody = [
  '### Context',
  'We need a thing decided.',
  '### Options',
  'A) Do the safe thing (recommended)',
  'B) Do the fast thing',
  '### Recommendation + why',
  'A, because safety.',
  '### Cost of delay',
  'Copy desk idles on persona names.',
  '### Affects',
  '#463 #480',
  '### Tier',
  'T2 — banked for the daily brief (default)',
].join('\n');

const emptyState = { decisions: [], intake: [], alerts: [], openPRs: [], mergedPRs: [], growth: null };

describe('extractOptions', () => {
  it('pulls lettered options from a form body', () => {
    expect(extractOptions(formBody)).toEqual([
      'A) Do the safe thing (recommended)',
      'B) Do the fast thing',
    ]);
  });
  it('returns [] for unparseable bodies instead of guessing', () => {
    expect(extractOptions('free-text ramble with no headings')).toEqual([]);
    expect(extractOptions(undefined)).toEqual([]);
  });
});

describe('extractField', () => {
  it('pulls a named form field', () => {
    expect(extractField(formBody, 'Cost of delay')).toBe('Copy desk idles on persona names.');
    expect(extractField(formBody, 'Affects')).toBe('#463 #480');
  });
  it('is empty for a missing field', () => {
    expect(extractField(formBody, 'Deadline')).toBe('');
  });
  it('survives regex metacharacters in the label (real form labels have them)', () => {
    const body = '### Recommendation + why\nA, because safety.\n### Deadline (only if real)\n2026-07-20';
    expect(extractField(body, 'Recommendation + why')).toBe('A, because safety.');
    expect(extractField(body, 'Deadline (only if real)')).toBe('2026-07-20');
  });
});

describe('todayLA', () => {
  it('renders the LA-clock date, not UTC', () => {
    // 2026-07-12 02:30 UTC is still 2026-07-11 in Los Angeles (PDT, UTC-7)
    expect(todayLA(new Date('2026-07-12T02:30:00Z'))).toBe('2026-07-11');
    expect(todayLA(new Date('2026-07-12T14:00:00Z'))).toBe('2026-07-12');
  });
});

describe('formatGrowthLine', () => {
  it('says so plainly when no snapshot exists yet', () => {
    expect(formatGrowthLine(null)).toBe("- Growth: no snapshot yet (growth-snapshot.yml hasn't run)");
  });

  it('formats follower counts, signed deltas, and posts-today', () => {
    const line = formatGrowthLine({
      followers: { instagram: 1204, x: 340, facebook: 89 },
      deltas: { instagram: 18, x: 5, facebook: 0 },
      postsToday: 2,
    });
    expect(line).toBe('- Growth: IG 1.2k (+18) · X 340 (+5) · FB 89 (+0) · 2 posts today · site: pending #799');
  });

  it('renders "?" for a platform that failed to fetch and omits its delta', () => {
    const line = formatGrowthLine({
      followers: { instagram: null, x: 340, facebook: 89 },
      deltas: { instagram: null, x: 5, facebook: null },
      postsToday: 1,
    });
    expect(line).toBe('- Growth: IG ? · X 340 (+5) · FB 89 · 1 post today · site: pending #799');
  });
});

describe('fetchGrowthSnapshot', () => {
  let dir: string;
  afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }); });

  it('returns null when the metrics directory does not exist yet', () => {
    expect(fetchGrowthSnapshot(path.join(tmpdir(), 'nonexistent-metrics-dir'))).toBeNull();
  });

  it('computes deltas against the prior day on day two', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'growth-metrics-'));
    writeFileSync(path.join(dir, '2026-07-16.json'), JSON.stringify({ date: '2026-07-16', followers: { x: 335, instagram: 1182, facebook: 89 }, postsToday: 1 }));
    writeFileSync(path.join(dir, '2026-07-17.json'), JSON.stringify({ date: '2026-07-17', followers: { x: 340, instagram: 1200, facebook: 89 }, postsToday: 2 }));
    expect(fetchGrowthSnapshot(dir)).toEqual({
      date: '2026-07-17',
      followers: { x: 340, instagram: 1200, facebook: 89 },
      postsToday: 2,
      deltas: { x: 5, instagram: 18, facebook: 0 },
    });
  });

  it('yields null deltas on day one (no prior file)', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'growth-metrics-'));
    writeFileSync(path.join(dir, '2026-07-16.json'), JSON.stringify({ date: '2026-07-16', followers: { x: 335, instagram: 1182, facebook: 89 }, postsToday: 1 }));
    expect(fetchGrowthSnapshot(dir)).toEqual({
      date: '2026-07-16',
      followers: { x: 335, instagram: 1182, facebook: 89 },
      postsToday: 1,
      deltas: { x: null, instagram: null, facebook: null },
    });
  });
});

describe('buildBrief', () => {
  it('renders a decision as unchecked boxes with cost and affects', () => {
    const brief = buildBrief(
      {
        ...emptyState,
        decisions: [{ number: 501, title: '[decision] Persona names', body: formBody, createdAt: '2026-07-12T01:00:00Z' }],
      },
      { date: '2026-07-12', now: NOW },
    );
    expect(brief).toContain('# Founders’ Brief — 2026-07-12'.replace('’', "'"));
    expect(brief).toContain('### #501 — Persona names');
    expect(brief).toContain('- [ ] A) Do the safe thing (recommended)');
    expect(brief).not.toContain('- [x]'); // nothing may ever be pre-ticked
    expect(brief).toContain('Cost of delay: Copy desk idles on persona names.');
    expect(brief).toContain('Unblocks: #463 #480');
  });

  it('flags intake items older than 48h', () => {
    const brief = buildBrief(
      {
        ...emptyState,
        intake: [
          { number: 1, title: 'old drop', body: '', createdAt: '2026-07-09T00:00:00Z' },
          { number: 2, title: 'fresh drop', body: '', createdAt: '2026-07-12T09:00:00Z' },
        ],
      },
      { date: '2026-07-12', now: NOW },
    );
    expect(brief).toContain('Intake queue: 2 open — ⚠ 1 older than 48h untriaged');
  });

  it('says so when nothing needs the founders', () => {
    const brief = buildBrief(emptyState, { date: '2026-07-12', now: NOW });
    expect(brief).toContain('_Nothing needs you today._');
    expect(brief).toContain('none 🟢');
  });

  it('separates merged-today from open PRs', () => {
    const brief = buildBrief(
      {
        ...emptyState,
        openPRs: [{ number: 9, title: 'wip thing', isDraft: true, createdAt: '2026-07-11T00:00:00Z', author: { login: 'x' } }],
        mergedPRs: [
          { number: 7, title: 'landed today', mergedAt: '2026-07-12T08:00:00Z' },
          { number: 3, title: 'landed last week', mergedAt: '2026-07-05T08:00:00Z' },
        ],
      },
      { date: '2026-07-12', now: NOW },
    );
    expect(brief).toContain('- #7 landed today');
    expect(brief).not.toContain('- #3 landed last week');
    expect(brief).toContain('- #9 wip thing — draft');
  });

  it('includes the Growth line in Health', () => {
    const withSnapshot = buildBrief(
      { ...emptyState, growth: { followers: { instagram: 1200, x: 340, facebook: 89 }, deltas: { instagram: 18, x: 5, facebook: 0 }, postsToday: 2 } },
      { date: '2026-07-12', now: NOW },
    );
    expect(withSnapshot).toContain('- Growth: IG 1.2k (+18) · X 340 (+5) · FB 89 (+0) · 2 posts today · site: pending #799');

    const noSnapshot = buildBrief(emptyState, { date: '2026-07-12', now: NOW });
    expect(noSnapshot).toContain("- Growth: no snapshot yet (growth-snapshot.yml hasn't run)");
  });
});

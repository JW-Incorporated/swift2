import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { buildBrief, extractField, extractOptions, fetchGrowthSnapshot, fetchQueueStatus, formatGrowthLine, todayLA } from './assemble-brief.mjs';

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

const emptyQueueStatus = { total: 0, scheduled: 0, due: 0, awaitingApproval: 0 };
const emptyState = { decisions: [], intake: [], alerts: [], openPRs: [], mergedPRs: [], growth: null, queueStatus: emptyQueueStatus };

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
    expect(formatGrowthLine(null, emptyQueueStatus)).toBe(
      "- Growth: no snapshot yet (growth-snapshot.yml hasn't run) · queue: empty (nothing drafted)",
    );
  });

  it('formats follower counts, signed deltas, and a per-platform 24h post count', () => {
    const line = formatGrowthLine(
      {
        followers: { instagram: 1204, x: 340, facebook: 89 },
        deltas: { instagram: 18, x: 5, facebook: 0 },
        postsToday: 2,
        postsLast24h: { total: 3, x: 1, instagram: 1, facebook: 1 },
      },
      emptyQueueStatus,
    );
    expect(line).toBe(
      '- Growth: IG 1.2k (+18) · X 340 (+5) · FB 89 (+0) · 3 posts/24h (X 1/IG 1/FB 1) · queue: empty (nothing drafted) · site: pending #799',
    );
  });

  it('renders "?" for a platform that failed to fetch and omits its delta', () => {
    const line = formatGrowthLine(
      {
        followers: { instagram: null, x: 340, facebook: 89 },
        deltas: { instagram: null, x: 5, facebook: null },
        postsToday: 1,
        postsLast24h: { total: 1, x: 0, instagram: 1, facebook: 0 },
      },
      emptyQueueStatus,
    );
    expect(line).toBe('- Growth: IG ? · X 340 (+5) · FB 89 · 1 post/24h (X 0/IG 1/FB 0) · queue: empty (nothing drafted) · site: pending #799');
  });

  // The 2026-08-11 misread: the brief showed one aggregate "0 posts today"
  // number taken at 11:05 UTC against a 23:00 UTC posting cadence, and it was
  // read as "the X poster is silently failing" while X had posted six nights
  // running. The per-platform 24h window can't produce that ambiguity.
  it('shows X posting even when the calendar-day count is 0', () => {
    const line = formatGrowthLine(
      {
        followers: { instagram: 1, x: 0, facebook: 8 },
        deltas: { instagram: 0, x: 0, facebook: 0 },
        postsToday: 0,
        postsLast24h: { total: 2, x: 1, instagram: 1, facebook: 0 },
      },
      emptyQueueStatus,
    );
    expect(line).toContain('2 posts/24h (X 1/IG 1/FB 0)');
    expect(line).not.toContain('0 posts');
  });

  it('falls back to the legacy count, labelled, for snapshots taken before the 24h window existed', () => {
    const line = formatGrowthLine(
      { followers: { instagram: 1, x: 0, facebook: 8 }, deltas: { instagram: null, x: null, facebook: null }, postsToday: 2 },
      emptyQueueStatus,
    );
    expect(line).toContain('2 posts today (pre-24h-window snapshot)');
  });

  it('reports scheduled and due counts separately — the ground truth a curation pass must copy, not invent', () => {
    const line = formatGrowthLine(null, { total: 3, scheduled: 2, due: 1, awaitingApproval: 0 });
    expect(line).toContain('queue: 2 scheduled to post, 1 due now');
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

describe('fetchQueueStatus', () => {
  let dir: string;
  afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }); });

  it('is all zeros when the queue directory does not exist', () => {
    expect(fetchQueueStatus(path.join(tmpdir(), 'nonexistent-queue-dir'))).toEqual(emptyQueueStatus);
  });

  it('reads real queue files off disk and splits scheduled from due', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'social-queue-'));
    writeFileSync(path.join(dir, 'a.json'), JSON.stringify({ platform: 'x', scheduledAt: '2099-01-01T00:00:00Z' }));
    writeFileSync(path.join(dir, 'b.json'), JSON.stringify({ platform: 'instagram', scheduledAt: '2020-01-01T00:00:00Z' }));
    expect(fetchQueueStatus(dir)).toEqual({ total: 2, scheduled: 1, due: 1, awaitingApproval: 0 });
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
      {
        ...emptyState,
        growth: {
          followers: { instagram: 1200, x: 340, facebook: 89 },
          deltas: { instagram: 18, x: 5, facebook: 0 },
          postsToday: 2,
          postsLast24h: { total: 2, x: 1, instagram: 1, facebook: 0 },
        },
      },
      { date: '2026-07-12', now: NOW },
    );
    expect(withSnapshot).toContain(
      '- Growth: IG 1.2k (+18) · X 340 (+5) · FB 89 (+0) · 2 posts/24h (X 1/IG 1/FB 0) · queue: empty (nothing drafted) · site: pending #799',
    );

    const noSnapshot = buildBrief(emptyState, { date: '2026-07-12', now: NOW });
    expect(noSnapshot).toContain("- Growth: no snapshot yet (growth-snapshot.yml hasn't run) · queue: empty (nothing drafted)");
  });

  it('reports real queue counts instead of leaving them to be invented', () => {
    const brief = buildBrief(
      { ...emptyState, queueStatus: { total: 2, scheduled: 2, due: 0, awaitingApproval: 0 } },
      { date: '2026-07-12', now: NOW },
    );
    expect(brief).toContain('queue: 2 scheduled to post');
  });
});

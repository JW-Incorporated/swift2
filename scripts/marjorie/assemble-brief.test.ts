import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { buildBrief, extractField, extractOptions, fetchGrowthSnapshot, fetchQueueStatus, formatGrowthLine, todayLA, shortTitle, ghCriticalList, renderCommunityTasksLine } from './assemble-brief.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { GATES, parseGateTable as parseTable } from './gate-history.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import * as ghMjs from '../lib/gh.mjs';

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

// A 12-gate tracker in the real file's shape, all red, so buildBrief has a
// goalpost to measure against.
const gateTable = [
  '| # | Gate | Status | Next action · owner |',
  '|---|---|---|---|',
  ...GATES.map((g: string) => `| ${g} | a description | 🔴 not started | do the thing · Some desk |`),
].join('\n');

const emptyState = {
  decisions: [], askedBefore: [], intake: [], alerts: [],
  openPRs: [], allPRs: [], allIssues: [], briefs: [],
  gates: {}, series: [], ciRuns: [],
  growth: null, queueStatus: emptyQueueStatus, constraints: null,
  // v3 additions (2026-08-23) — empty-but-present so buildBrief never sees
  // `undefined` where it expects an array/object.
  founderTasks: [], openActions: [], contentShipped: [], postedSince: [],
  communityTasks: null,
  doneItems: {}, doneSeries: [],
};

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

describe('renderCommunityTasksLine', () => {
  it('is null with no summary (query failed or Community Engine not configured yet)', () => {
    expect(renderCommunityTasksLine(null)).toBeNull();
  });

  it('is null when there is genuinely nothing to point at (never a padding line)', () => {
    expect(renderCommunityTasksLine({ draftedLast24h: 0, repliesWaiting: 0 })).toBeNull();
  });

  it('mentions the draft count and points at the Community Tasks email', () => {
    const line = renderCommunityTasksLine({ draftedLast24h: 4, repliesWaiting: 0 });
    expect(line).toBe('- Community tasks: 4 community drafts ready to paste — see today\'s Community Tasks email.');
  });

  it('adds a replies-waiting clause only when there are any', () => {
    const line = renderCommunityTasksLine({ draftedLast24h: 1, repliesWaiting: 2 });
    expect(line).toContain('1 community draft ready to paste');
    expect(line).toContain('2 reply/replies waiting');
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

describe('shortTitle', () => {
  it('cuts at a word boundary — a line ending mid-word reads as a bug', () => {
    expect(shortTitle('LEGAL/image: 17 distinct Getty comp URLs hotlinked across 4 era files')).not.toMatch(/\ber…$/);
    expect(shortTitle('[decision] Persona names')).toBe('Persona names');
    expect(shortTitle('Feedback chatbot pilot — spec ready, DORMANT')).toBe('Feedback chatbot pilot');
  });
});

describe('buildBrief — five sections (v3, 2026-08-23)', () => {
  const withGates = { ...emptyState, gates: parseTable(gateTable) };

  it('leads with Waiting on you, then Last 24h, then Gates, then Social strategy, then Distance to done', () => {
    const brief = buildBrief(withGates, { date: '2026-07-12', now: NOW });
    expect(brief).toContain("# Founders' Brief — 2026-07-12");
    expect(brief).toContain('## 1 · Waiting on you');
    expect(brief).toContain('## 2 · Last 24 hours');
    expect(brief).toContain('## 3 · Gates — product Definition of Done');
    expect(brief).toContain('## 4 · Social strategy');
    expect(brief).toContain('## 5 · Distance to done + maintenance');
    const order = ['## 1 ·', '## 2 ·', '## 3 ·', '## 4 ·', '## 5 ·'].map((h) => brief.indexOf(h));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('never pre-ticks a box', () => {
    const decision = {
      number: 501, title: '[decision] Persona names', body: formBody, state: 'OPEN',
      labels: [{ name: 'founder-decision' }], createdAt: '2026-07-11T01:00:00Z', comments: [],
    };
    const brief = buildBrief({ ...withGates, decisions: [decision] }, { date: '2026-07-12', now: NOW });
    expect(brief).toContain('#501');
    expect(brief).toContain('- [ ] ');
    expect(brief).not.toContain('- [x]');
  });

  it('says so plainly when nothing is waiting on the founder at all', () => {
    expect(buildBrief(withGates, { date: '2026-07-12', now: NOW })).toContain('Nothing is gated on you');
  });

  it('folds open HUMAN-ACTIONS items into Waiting on you, with age', () => {
    const brief = buildBrief({
      ...withGates,
      openActions: [{ number: 4, tag: 'UPGRADE', title: 'API accounts for research', ageDays: 8 }],
    }, { date: '2026-07-12', now: NOW });
    expect(brief).toContain('HA#4');
    expect(brief).toContain('waiting 8d');
    expect(brief).not.toContain('Nothing is gated on you');
  });

  // 2026-09-06 content-quality fix: surface which open HUMAN-ACTIONS items
  // are cheap to clear, so a founder skimming top-to-bottom doesn't have to
  // read every line's own "~N min" estimate by hand to find a quick win.
  it('surfaces a "Quickest to clear" callout above the full checklist, fastest first', () => {
    const brief = buildBrief({
      ...withGates,
      openActions: [
        { number: 1, tag: 'BLOCKING', title: 'Big thing — ~35 min total', ageDays: 1 },
        { number: 2, tag: 'BLOCKING', title: 'Tiny thing — ~2 min', ageDays: 1 },
        { number: 3, tag: 'UPGRADE', title: 'Medium thing — ~10 min', ageDays: 1 },
      ],
    }, { date: '2026-07-12', now: NOW });
    expect(brief).toContain('⚡ Quickest to clear');
    const calloutLine = brief.split('\n').find((l) => l.includes('Quickest to clear'));
    expect(calloutLine).toBeDefined();
    // Fastest (HA#2, 2m) must appear before the slower one (HA#3, 10m); the
    // over-cap item (HA#1, 35m) must not appear in the callout at all.
    expect(calloutLine!.indexOf('HA#2')).toBeLessThan(calloutLine!.indexOf('HA#3'));
    expect(calloutLine).not.toContain('HA#1');
    // The full checklist below is untouched — every item still listed.
    expect(brief).toContain('HA#1');
  });

  it('lists up to 4 quick wins and says how many more exist beyond that', () => {
    const brief = buildBrief({
      ...withGates,
      openActions: Array.from({ length: 6 }, (_, i) => ({
        number: 10 + i, tag: 'UPGRADE', title: `Item ${i} — ~${i + 1} min`, ageDays: 1,
      })),
    }, { date: '2026-07-12', now: NOW });
    const calloutLine = brief.split('\n').find((l) => l.includes('Quickest to clear'))!;
    expect(calloutLine).toContain('+2 more');
  });

  it('omits the callout entirely when no open action has a parseable ~N min estimate', () => {
    const brief = buildBrief({
      ...withGates,
      openActions: [{ number: 7, tag: 'UPGRADE', title: 'No estimate at all', ageDays: 1 }],
    }, { date: '2026-07-12', now: NOW });
    expect(brief).not.toContain('Quickest to clear');
  });

  it('folds open founder-task issues into Waiting on you', () => {
    const brief = buildBrief({
      ...withGates,
      founderTasks: [{ number: 1955, title: 'founder-task: paste your IG Insights', labels: [{ name: 'founder-task' }], state: 'OPEN', createdAt: '2026-07-11T01:00:00Z', comments: [] }],
    }, { date: '2026-07-12', now: NOW });
    expect(brief).toContain('#1955');
    expect(brief).toContain('founder-task');
  });

  // 2026-09-05 audit: founder-tasks were rendered from the raw open list and
  // never resolved against their own thread — Joey's "All 3 tasks are
  // complete" on #2195 (08-17) was invisible for 19 briefs.
  it('clears a founder-task the founder answered on the task itself', () => {
    const brief = buildBrief({
      ...withGates,
      briefs: [{ number: 1, createdAt: '2026-07-11T12:00:00Z', body: '- [ ] [#2195](https://github.com/o/r/issues/2195) **founder-task**' }],
      founderTasks: [{
        number: 2195, title: 'founder-task: social reach', labels: [{ name: 'founder-task' }], state: 'OPEN', createdAt: '2026-07-05T01:00:00Z',
        comments: [{ author: { login: 'sffan15-sys' }, createdAt: '2026-07-11T23:00:00Z', body: 'All 3 tasks are complete.' }],
      }],
    }, { date: '2026-07-12', now: NOW });
    expect(brief).not.toContain('- [ ] [#2195]');
    expect(brief).toContain('**Cleared: 1**');
    expect(brief).toContain('#2195');
  });

  it('renders the Definition of Done table with every non-green item stating why', () => {
    const brief = buildBrief({
      ...withGates,
      doneItems: {
        1: { title: 'Landing page rethink', status: 'notstarted', blockedOn: 'nobody', nextAction: 'spec it' },
        2: { title: 'Cards differentiated', status: 'yellow', blockedOn: 'founder', nextAction: 'Joey checks it' },
      },
      doneSeries: [],
    }, { date: '2026-07-12', now: NOW });
    expect(brief).toContain('Landing page rethink');
    expect(brief).toContain('unstaffed');
    expect(brief).toContain('Cards differentiated');
    expect(brief).toContain('blocked on founder');
  });

  it('points at the live definition-of-done.md and social-strategy.md, not the superseded launch-readiness.md, for the current bar', () => {
    const brief = buildBrief(withGates, { date: '2026-07-12', now: NOW });
    expect(brief).toContain('docs/definition-of-done.md');
    expect(brief).toContain('docs/marketing/social-strategy.md');
  });

  it('the Distance-to-done estimator still names itself as the historical proxy, honestly, not silently repointed', () => {
    const brief = buildBrief(withGates, { date: '2026-07-12', now: NOW });
    expect(brief).toContain('12 historical launch-readiness gates');
  });

  it('calls a day with no merges, no closes, no new content, and no new posts a failed org day', () => {
    expect(buildBrief(withGates, { date: '2026-07-12', now: NOW })).toContain('failed org day');
  });

  it('does not call it a failed day when new content shipped even with zero PR/issue activity', () => {
    const brief = buildBrief({
      ...withGates,
      contentShipped: [{ pr: { number: 2291, title: 'content: red era' }, files: ['supabase/seed/content/red.mjs'] }],
    }, { date: '2026-07-12', now: NOW });
    expect(brief).not.toContain('failed org day');
    expect(brief).toContain('New on the site');
  });

  it('reports new social posts from the last 24h', () => {
    const brief = buildBrief({
      ...withGates,
      postedSince: [{ platform: 'x', body: 'a real post', campaign: 'on-this-day:x', postedAt: '2026-07-12T05:00:00Z', url: 'https://x.com/1' }],
    }, { date: '2026-07-12', now: NOW });
    expect(brief).toContain('New on social');
    expect(brief).toContain('a real post');
  });

  it('reports posts per platform over a rolling 24h window when the snapshot has one', () => {
    const withSnapshot = buildBrief(
      {
        ...withGates,
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
  });

  it('includes the deterministic merch revenue section when a weekly report is available', () => {
    const brief = buildBrief(
      { ...withGates, revenueSection: '## Merch revenue and clicks\n\n- Total reported: 6 clicks · $4.75' },
      { date: '2026-07-12', now: NOW },
    );
    expect(brief).toContain('## Merch revenue and clicks');
    expect(brief).toContain('6 clicks · $4.75');
  });

  it('reports what landed in the last 24h from real timestamps', () => {
    const brief = buildBrief({
      ...withGates,
      allPRs: [
        { number: 7, title: 'landed today', mergedAt: '2026-07-12T08:00:00Z', createdAt: '2026-07-12T07:00:00Z', headRefName: 'x' },
        { number: 3, title: 'landed last week', mergedAt: '2026-07-05T08:00:00Z', createdAt: '2026-07-05T07:00:00Z', headRefName: 'x' },
      ],
    }, { date: '2026-07-12', now: NOW });
    expect(brief).toContain('#7 landed today');
    expect(brief).not.toContain('#3 landed last week');
  });

  it('keeps the growth line as the single source for any social claim', () => {
    const brief = buildBrief(
      { ...withGates, growth: { followers: { instagram: 1200, x: 340, facebook: 89 }, deltas: { instagram: 18, x: 5, facebook: 0 }, postsToday: 2 } },
      { date: '2026-07-12', now: NOW },
    );
    expect(brief).toContain('- Growth: IG 1.2k (+18) · X 340 (+5) · FB 89 (+0) · 2 posts today (pre-24h-window snapshot) · queue: empty (nothing drafted) · site: pending #799');
  });

  it('stamps its own line and word count so a run cannot silently blow the cap', () => {
    const brief = buildBrief(withGates, { date: '2026-07-12', now: NOW });
    expect(brief).toMatch(/<!-- budget: \d+ lines \/ \d+ words -->/);
  });
});

// #3689: assemble-brief.mjs's own `gh()` wrapper discarded the
// `capExhausted` flag gh.mjs computes for every list call, so a founder ask
// past whatever page the underlying fetch happened to stop on rendered as
// "0 asks" instead of as the truncated-data bug it is. `ghCriticalList` is
// the fix for the ASK-SOURCE queries (founder-decision, founder-task):
// refuse the run rather than silently under-report.
describe('ghCriticalList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the rows unchanged when the fetch is complete', async () => {
    vi.spyOn(ghMjs, 'gh').mockResolvedValue({ stdout: '[{"number":1}]', capExhausted: false, complete: true });
    await expect(ghCriticalList(['issue', 'list'])).resolves.toEqual([{ number: 1 }]);
  });

  it('throws loudly instead of returning a truncated list as if it were complete', async () => {
    vi.spyOn(ghMjs, 'gh').mockResolvedValue({ stdout: '[]', capExhausted: true, complete: false });
    await expect(ghCriticalList(['issue', 'list', '--label', 'founder-decision'])).rejects.toThrow(/#3689/);
  });
});

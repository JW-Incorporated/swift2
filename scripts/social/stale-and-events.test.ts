// Bots v2 W8: stale-draft retirement, same-day event dispatch, the failure receipt.
import { describe, expect, it } from 'vitest';
import { buildReceipt, causeOf } from './draft-receipt.mjs';
import { collectGithub } from './prepare-draft-inputs.mjs';
import { retiredComment, sweep, MAX_RETIRED_PER_RUN } from './retire-stale-drafts.mjs';
import { staleReason } from './lib/draft-prs.mjs';
import { DISPATCH_LABEL, EVENT_DAILY_CAP, judgeTitle, pickEvents } from './lib/event-dispatch.mjs';

const NOW = Date.parse('2026-10-01T12:00:00Z');
const H = 3_600_000;
const ago = (hours: number) => new Date(NOW - hours * H).toISOString();
const pr = (over: Record<string, unknown> = {}) => ({ number: 1, createdAt: ago(72), labels: ['social-draft'], queuePaths: ['social/queue/a.json'], failingChecks: [], ...over });
const unstamped = [{ data: { platform: 'x' } }];
const stamped = (hoursAgo: number) => [{ data: { platform: 'x', approval: { at: ago(hoursAgo) } } }];

describe('staleReason — the three dead draft shapes', () => {
  it('retires a draft nobody approved after 48h, and leaves a young one alone', () => {
    expect(staleReason(pr(), unstamped, NOW)).toMatch(/no founder approval stamp/);
    expect(staleReason(pr({ createdAt: ago(40) }), unstamped, NOW)).toBeNull();
  });
  it('retires a PR with no queue files left (every draft was rejected)', () => {
    expect(staleReason(pr({ queuePaths: [] }), [], NOW)).toMatch(/every draft was removed/);
  });
  it('retires an approved-but-stranded PR only when a check is red and the stamp is old', () => {
    expect(staleReason(pr({ failingChecks: ['check-drafts'] }), stamped(60), NOW)).toMatch(/approved 60h ago.*check-drafts failing/);
    expect(staleReason(pr({ failingChecks: [] }), stamped(60), NOW)).toBeNull(); // green: the poll will merge it
    expect(staleReason(pr({ failingChecks: ['check-drafts'] }), stamped(10), NOW)).toBeNull(); // freshly approved
  });
  it('never touches a hold, a partly-stamped PR, or one it could not read (fail closed)', () => {
    expect(staleReason(pr({ labels: ['social-draft', 'hold'] }), unstamped, NOW)).toBeNull();
    expect(staleReason(pr(), [...stamped(60), ...unstamped], NOW)).toBeNull();
    expect(staleReason(pr(), [{ data: null }], NOW)).toBeNull();
  });
});

function fakeGh(prs: Array<Record<string, unknown>>, files: Record<string, unknown>) {
  const calls: string[][] = [];
  const run = (args: string[]) => {
    calls.push(args);
    if (args[0] === 'pr' && args[1] === 'list') return JSON.stringify(prs.map((p) => ({ ...p, files: ((p.queuePaths as string[]) ?? []).map((path) => ({ path })), statusCheckRollup: ((p.failingChecks as string[]) ?? []).map((name) => ({ name, conclusion: 'FAILURE' })) })));
    if (args[0] === 'api') {
      const path = /contents\/([^?]+)\?/.exec(args[1])![1];
      return JSON.stringify({ content: Buffer.from(JSON.stringify(files[path])).toString('base64') });
    }
    return '';
  };
  return { run, calls };
}

describe('sweep', () => {
  const prs = [
    { number: 10, createdAt: ago(72), headRefOid: 'a'.repeat(40), labels: [{ name: 'social-draft' }], queuePaths: ['social/queue/old.json'] },
    { number: 11, createdAt: ago(5), headRefOid: 'b'.repeat(40), labels: [{ name: 'social-draft' }], queuePaths: ['social/queue/new.json'] },
    { number: 12, createdAt: ago(72), headRefOid: 'c'.repeat(40), labels: [{ name: 'social-draft' }], queuePaths: ['social/queue/ok.json'] },
  ];
  const files = { 'social/queue/old.json': { platform: 'x' }, 'social/queue/new.json': { platform: 'x' }, 'social/queue/ok.json': { platform: 'x', approval: { at: ago(3) } } };

  it('a dry run decides but closes nothing', () => {
    const { run, calls } = fakeGh(prs, files);
    const out = sweep(run, { repo: 'o/r', nowMs: NOW });
    expect(out.filter((d: { retire: boolean }) => d.retire).map((d: { pr: number }) => d.pr)).toEqual([10]); // 11 is young; 12 is stamped with a green check
    expect(out.find((d: { pr: number }) => d.pr === 10)).toMatchObject({ retire: true });
    expect(calls.some((c) => c[0] === 'pr' && c[1] === 'close')).toBe(false);
  });

  it('--apply closes only the stale unapproved one, with a retired: comment (never reject:)', () => {
    const { run, calls } = fakeGh(prs, files);
    sweep(run, { repo: 'o/r', nowMs: NOW, apply: true });
    const closes = calls.filter((c) => c[0] === 'pr' && c[1] === 'close');
    expect(closes).toHaveLength(1);
    expect(closes[0].slice(0, 3)).toEqual(['pr', 'close', '10']);
    expect(closes[0][4]).toMatch(/^retired: open \d+h with no founder approval stamp/);
    expect(retiredComment('x')).not.toMatch(/^reject:/);
  });

  it('caps how many it retires in one run', () => {
    const many = Array.from({ length: MAX_RETIRED_PER_RUN + 3 }, (_, i) => ({ number: 100 + i, createdAt: ago(72), headRefOid: 'd'.repeat(40), labels: [{ name: 'social-draft' }], queuePaths: ['social/queue/old.json'] }));
    const { run } = fakeGh(many, files);
    expect(sweep(run, { repo: 'o/r', nowMs: NOW }).filter((d: { retire: boolean }) => d.retire)).toHaveLength(MAX_RETIRED_PER_RUN);
  });
});

describe('collectGithub degrades to warnings, never throws', () => {
  it('turns an unreadable section into a warning and an empty list', () => {
    const warnings: string[] = [];
    const out = collectGithub(() => { throw new Error('HTTP 502'); }, { nowMs: NOW, repo: 'o/r', warnings });
    expect(out).toEqual({ openDrafts: [], closedPrs: [], intakeIssues: [] });
    expect(warnings).toHaveLength(3);
    expect(warnings[0]).toMatch(/could not be read.*unknown, not as empty/);
  });
});

describe('event dispatch', () => {
  const issue = (number: number, title: string, hoursAgo = 3, labels: string[] = ['intake']) => ({ number, title, createdAt: ago(hoursAgo), labels });

  it('judges titles: a release is in, a lawsuit or a listing is out', () => {
    expect(judgeTitle("intake: Taylor Swift's 'Patient Zero' music video premieres at the VMAs").ok).toBe(true);
    expect(judgeTitle('intake: Taylor Swift moves to dismiss trademark lawsuit').ok).toBe(false);
    expect(judgeTitle("intake: Taylor Swift's former home listed for $7.9M").ok).toBe(false);
    expect(judgeTitle('codify: L001 — never re-use').ok).toBe(false);
  });

  it('picks newest-first, skips dispatched and covered events, and honours the daily cap', () => {
    const issues = [
      issue(1, 'intake: Taylor Swift announces a new single', 20),
      issue(2, "intake: 'Cleveland!' lyric video drops", 2),
      issue(3, 'intake: Taylor Swift releases a trailer', 5, ['intake', DISPATCH_LABEL]),
      issue(4, 'intake: Taylor Swift wins another award', 30),
      issue(5, "intake: 'Opalite' video teaser released", 6),
    ];
    const covered = [{ data: { body: "the 'Opalite' video teaser is out", campaign: 'c', why: 'w' } }];
    const { picks, skipped } = pickEvents({ issues, socialItems: covered, nowMs: NOW });
    expect(picks.map((p: { number: number }) => p.number)).toEqual([2, 1]);
    expect(skipped.map((s: { why: string }) => s.why)).toEqual(expect.arrayContaining(['already dispatched', 'older than 24h', 'already covered by a posted/queued/drafted item']));
    expect(EVENT_DAILY_CAP).toBe(2);
    expect(pickEvents({ issues, socialItems: covered, nowMs: NOW, dispatchedToday: 1 }).picks).toHaveLength(1);
    expect(pickEvents({ issues, socialItems: covered, nowMs: NOW, dispatchedToday: 2 }).picks).toEqual([]);
  });
});

describe('failure receipt', () => {
  const usage = { numTurns: 51, maxTurns: 50, totalCostUsd: 8.548, diagnostic: { isError: true, resultSubtype: 'error_max_turns' } };

  it('names a turn-cap death with its numbers', () => {
    expect(causeOf(usage)).toBe('hit its turn cap (51/50 turns, $8.55 list-price) before opening a PR');
    expect(causeOf(null)).toMatch(/failed before telemetry/);
  });

  it('says what the pre-compute had decided, so a re-run is understood without opening the log', () => {
    const inputs = {
      backlog: { heldItems: 2, skipAt: 8, skipCalendarDrafting: false }, photos: { neverUsed: 10, library: 54 }, events: { uncovered: [{}] },
      beats: [{ date: '2026-10-01', text: 'x', needsDraft: true, photo: { photoId: 'p1' } }, { date: '2026-10-02', text: null }],
    };
    const body = buildReceipt({ kind: 'daily', result: 'failure', runUrl: 'https://example.com/run', day: '2026-10-01', inputs, usage });
    expect(body).toContain('did not finish — 2026-10-01');
    expect(body).toContain('turn cap (51/50');
    expect(body).toContain('2026-10-01: needed a pair (pre-picked photo `p1`)');
    expect(body).toContain('2026-10-02: no calendar entry');
    expect(body).toContain('never-used photos 10/54');
    expect(body).toMatch(/Tier-2: Tree — daily social draft$/);
    expect(buildReceipt({ kind: 'event', result: 'failure', day: 'd', inputs: null, usage: null })).toMatch(/Tier-2: Tree — event draft$/);
  });
});

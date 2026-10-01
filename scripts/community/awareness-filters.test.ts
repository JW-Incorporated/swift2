import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  applyCandidateCaps,
  classifyThreadTypes,
  evaluateThread,
  isLockedOrArchived,
  isMegathread,
  scoreCandidate,
  sensitiveReason,
  threadAgeHours,
} from './awareness-filters.mjs';

const NOW = new Date('2026-10-01T12:00:00.000Z');
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const post = (title: string, overrides: Record<string, unknown> = {}) => ({
  id: 'abc',
  title,
  permalink: 'https://www.reddit.com/r/TaylorSwift/comments/abc/x/',
  createdAt: hoursAgo(5),
  rank: 3,
  ...overrides,
});
const sub = { name: 'TaylorSwift', tier: 1 };

describe('discovery filters', () => {
  it('measures age and treats a bad date as too old', () => {
    expect(threadAgeHours(hoursAgo(10), NOW)).toBeCloseTo(10);
    expect(threadAgeHours('nope', NOW)).toBe(Infinity);
    expect(evaluateThread(post('Rank the eras', { createdAt: 'nope' }), sub, { now: NOW })).toEqual(
      { ok: false, reason: 'too-old' },
    );
  });

  it('drops threads older than 48 hours and keeps ones inside the window', () => {
    expect(
      evaluateThread(post('Which era is the best?', { createdAt: hoursAgo(49) }), sub, { now: NOW })
        .reason,
    ).toBe('too-old');
    expect(
      evaluateThread(post('Which era is the best?', { createdAt: hoursAgo(47) }), sub, { now: NOW })
        .ok,
    ).toBe(true);
  });

  it('skips megathreads and locked or archived threads', () => {
    expect(isMegathread('Weekly Discussion Thread: era rankings')).toBe(true);
    expect(isMegathread('Daily discussion thread')).toBe(true);
    expect(evaluateThread(post('Mega thread: which era'), sub, { now: NOW }).reason).toBe(
      'megathread',
    );
    expect(isLockedOrArchived({ locked: true })).toBe(true);
    expect(isLockedOrArchived({ archived: true })).toBe(true);
    expect(isLockedOrArchived({})).toBe(false);
    expect(
      evaluateThread(post('Which era is the best?', { locked: true }), sub, { now: NOW }).reason,
    ).toBe('locked-or-archived');
  });

  it('skips sensitive personal-life threads (guardrail 4)', () => {
    expect(sensitiveReason('Travis and Taylor wedding rumours: which era vibes')).toBe(
      'personal-life',
    );
    expect(sensitiveReason('Rank the eras')).toBeNull();
    expect(evaluateThread(post('Taylor engagement news reaction'), sub, { now: NOW }).reason).toBe(
      'personal-life',
    );
  });

  it('classifies the thread types a site picture fits and drops threads that fit none', () => {
    expect(classifyThreadTypes('Rank every era from worst to best')).toContain('ranking');
    expect(classifyThreadTypes('When did folklore come out?')).toContain('timeline');
    expect(classifyThreadTypes('Easter egg theory about the 13 clue')).toContain('easter_egg');
    expect(classifyThreadTypes('10 years ago today, 1989 anniversary')).toContain('nostalgia');
    expect(classifyThreadTypes('Just announced: new tour dates')).toContain('news');
    expect(evaluateThread(post('Taylor Swift and the Fall Months'), sub, { now: NOW }).reason).toBe(
      'no-fit',
    );
  });

  it('skips crafts, fan art, trades and personal photos', () => {
    for (const title of [
      'Evermore Era Bedazzled Bookmarks!',
      'Single Cover Concept for the era',
      'My bestie made me this rank',
      'Mashup of two era songs [OC]',
    ]) {
      expect(evaluateThread(post(title), sub, { now: NOW }).reason).toBe('not-discussion');
    }
  });

  it('requires a Taylor reference on general-pop subs', () => {
    const popheads = { name: 'popheads', tier: 2, requireTaylor: true };
    expect(evaluateThread(post('Best pop album of the year?'), popheads, { now: NOW }).reason).toBe(
      'off-topic',
    );
    expect(evaluateThread(post('Best Taylor Swift era?'), popheads, { now: NOW }).ok).toBe(true);
  });

  it('returns the types and age for an accepted thread', () => {
    const verdict = evaluateThread(post('Which era is your favorite and why?'), sub, { now: NOW });
    expect(verdict).toMatchObject({ ok: true, types: ['ranking'] });
    expect(verdict.ageHours).toBeCloseTo(5);
  });
});

describe('candidate scoring and caps', () => {
  it('scores more types, better feed rank and better sub tier higher', () => {
    const base = { types: ['ranking'], rank: 10, ageHours: 5 };
    expect(scoreCandidate({ ...base, types: ['ranking', 'nostalgia'] }, sub)).toBeGreaterThan(
      scoreCandidate(base, sub),
    );
    expect(scoreCandidate({ ...base, rank: 1 }, sub)).toBeGreaterThan(scoreCandidate(base, sub));
    expect(scoreCandidate(base, { tier: 1 })).toBeGreaterThan(scoreCandidate(base, { tier: 3 }));
  });

  it('caps per sub per run, honours the sub daily budget, and caps the run', () => {
    const mk = (subreddit: string, score: number, n: number) => ({
      subreddit,
      score,
      post: { id: `${subreddit}${n}` },
    });
    const candidates = [
      ...[1, 2, 3, 4].map((n) => mk('A', 10 - n, n)),
      ...[1, 2].map((n) => mk('B', 5 - n, n)),
      mk('C', 1, 1),
    ];
    const kept = applyCandidateCaps(candidates, {
      perSubScanCap: 2,
      remainingToday: { A: 2, B: 1, C: 0 },
      runCap: 10,
    });
    expect(kept.map((c: { post: { id: string } }) => c.post.id)).toEqual(['A1', 'A2', 'B1']);
    const capped = applyCandidateCaps(candidates, { perSubScanCap: 2, runCap: 3 });
    expect(capped).toHaveLength(3);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkerClaudeCaller } from '../claude-call';
import { evaluateSameEventGate, loadDedupeCandidates, type DedupeCandidateRow } from './dedupe-gate';
import { selectCrossLaneCandidates } from './dedupe-crosslane';
import { mergeFactLists } from './dedupe-merge';
import { normalizeEntity, sameClaim, sharedEntityCount } from './dedupe-shortlist';
import { ExtractUsageStore, type UsageDb } from './usage-store';
import type { ExtractedFact } from './types';

const usageDb: UsageDb = { todaysCallCount: async () => 0, incrementToday: async () => undefined };

function row(overrides: Partial<DedupeCandidateRow> & { id: string; headline: string }): DedupeCandidateRow {
  return {
    summary: 'Summary.',
    detail: 'Detail.',
    sources: [],
    imageUrl: null,
    heat: 1,
    ...overrides,
  };
}

function fact(id: string, claim: string): ExtractedFact {
  return { id, claim, attribution: 'Billboard', confidence: 'reported' };
}

function claudeReturning(...data: unknown[]) {
  const fn = vi.fn();
  for (const item of data) fn.mockImplementationOnce(async () => ({ status: 'ok', data: item }));
  return fn as unknown as WorkerClaudeCaller;
}

afterEach(() => vi.unstubAllEnvs());

describe('dates in the same-event prompt', () => {
  it('carries observed_on for the new item and candidates, plus the recurring-event rule', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const usage = await ExtractUsageStore.create(usageDb);
    const claude = claudeReturning({ same_event: false, match_id: null, adds_new_info: false, new_facts: [] });
    await evaluateSameEventGate(usage, [row({
      id: 'night2', headline: 'Surprise song at Eras Tour Toronto night 2', observedOn: '2024-11-15',
    })], {
      headline: 'Surprise song at Eras Tour Toronto night 3', summary: 'Surprise song.', detail: 'x',
      observedOn: '2024-11-16',
    }, claude);
    const call = (claude as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0] as { user: string; system: string };
    expect(call.user).toContain('observed_on: 2024-11-16');
    expect(call.user).toContain('observed_on: 2024-11-15');
    expect(call.system).toContain('Different dates, shows, nights, or occurrences of a recurring event mean NOT the same event');
  });

  it('loads observed_on and orders newest first before the limit', async () => {
    const calls: string[] = [];
    const chain: Record<string, unknown> = {
      select: (cols: string) => { calls.push(`select:${cols}`); return chain; },
      eq: () => chain, is: () => chain, gte: () => chain, gt: () => chain,
      order: (column: string, opts: { ascending: boolean }) => {
        calls.push(`order:${column}:${opts.ascending}`);
        return chain;
      },
      limit: () => { calls.push('limit'); return chain; },
      then: (resolve: (r: { data: unknown[]; error: null }) => void) => resolve({
        data: [{ id: 'a', headline: 'h', summary: 's', detail: 'd', sources: [], observed_on: '2026-10-30' }],
        error: null,
      }),
    };
    const db = { from: () => chain } as unknown as Parameters<typeof loadDedupeCandidates>[0];
    const rows = await loadDedupeCandidates(db, 'tloas');
    expect(rows[0]?.observedOn).toBe('2026-10-30');
    expect(calls[0]).toContain('observed_on');
    expect(calls.indexOf('order:observed_on:false')).toBeGreaterThan(-1);
    expect(calls.indexOf('order:observed_on:false')).toBeLessThan(calls.indexOf('limit'));
  });
});

describe('moment match requires adds_new_info === false', () => {
  const moment = {
    id: 'abigail-released', eraId: 'tloas', date: '2026-10-20',
    title: 'Abigail released', summary: 'The Abigail song is released.',
  };
  const item = {
    headline: 'Abigail certified platinum, adds 3 tour dates',
    summary: 'Abigail is certified platinum and three tour dates are added.',
    detail: 'x', observedOn: '2026-10-28',
  };

  it('publishes (no discard) when the item adds new info, and shows the moment date and summary', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const usage = await ExtractUsageStore.create(usageDb);
    const claude = claudeReturning({
      same_event: true, match_id: `moment:${moment.id}`, adds_new_info: true, new_facts: ['platinum'],
    });
    const decision = await evaluateSameEventGate(usage, [], item, claude, {
      eraId: 'tloas', crossLane: { moments: [moment] },
    });
    expect(decision).toEqual({ action: 'publish' });
    const user = (claude as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0].user as string;
    expect(user).toContain('observed_on: 2026-10-20');
    expect(user).toContain('The Abigail song is released.');
  });
});

describe('claims with differing digits', () => {
  it('treats Nov 12 and Nov 13 as different facts', () => {
    expect(sameClaim('Tickets go on sale Nov 12 for the tour', 'Tickets go on sale Nov 13 for the tour')).toBe(false);
    expect(sameClaim('Tickets go on sale Nov 12 for the tour', 'Tickets go on sale Nov 12 for the tour!')).toBe(true);
    const merged = mergeFactLists(
      [fact('f1', 'Tickets go on sale Nov 12 for the tour')],
      [fact('f1', 'Tickets go on sale Nov 13 for the tour')],
      [], [],
    );
    expect(merged.mergedFacts).toHaveLength(2);
  });
});

describe('mixed merge', () => {
  it('discards when the original has facts and the new item has none (no prose rewrite)', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const usage = await ExtractUsageStore.create(usageDb);
    const claude = claudeReturning({ same_event: true, match_id: 'o1', adds_new_info: true, new_facts: ['x'] });
    const decision = await evaluateSameEventGate(usage, [row({
      id: 'o1', headline: 'Song pulled', facts: [fact('f1', 'The song was removed.')],
    })], { headline: 'Song pulled', summary: 'x', detail: 'x' }, claude);
    expect(decision).toEqual({ action: 'discard', candidateId: 'o1', reason: 'legacy_item_vs_v2_original' });
    expect(claude).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('legacy_item_vs_v2_original'));
    warn.mockRestore();
  });
});

describe('cross-lane selection', () => {
  const moment = { id: 'm1', eraId: 'tloas', date: '2026-11-01', title: 'Taylor tells the room about Abigail' };

  it('returns no moment candidates without observedOn', () => {
    const out = selectCrossLaneCandidates({ headline: 'Taylor and Abigail', summary: '' }, 'tloas', { moments: [moment] });
    expect(out).toEqual([]);
  });

  it('needs two shared non-stopword tokens for a video', () => {
    const videos = [{ videoId: 'v1', eraId: 'tloas', title: 'Opalite Official Music Video' }];
    const one = selectCrossLaneCandidates({ headline: 'Opalite tickets announced', summary: '' }, 'tloas', { videos });
    const two = selectCrossLaneCandidates({ headline: 'Opalite music video premiere', summary: '' }, 'tloas', { videos });
    expect(one).toEqual([]);
    expect(two.map((c) => c.id)).toEqual(['video:v1']);
  });
});

describe('entity normalization', () => {
  it('folds accents and strips possessives', () => {
    expect(normalizeEntity('Beyoncé')).toBe(normalizeEntity('Beyonce'));
    expect(normalizeEntity("Taylor Swift's")).toBe('taylor swift');
    expect(normalizeEntity('Taylor Swift’s')).toBe('taylor swift');
    expect(sharedEntityCount(['Beyoncé', "Taylor Swift's"], ['beyonce', 'Taylor Swift'])).toBe(1);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkerClaudeCaller } from '../claude-call';
import {
  CANDIDATE_WINDOW_DAYS,
  evaluateSameEventGate,
  loadDedupeCandidates,
  shortlistCandidates,
  type DedupeCandidateRow,
} from './dedupe-gate';
import { mergeFactLists } from './dedupe-merge';
import { ExtractUsageStore, type UsageDb } from './usage-store';
import type { ExtractedFact } from './types';

const usageDb: UsageDb = { todaysCallCount: async () => 0, incrementToday: async () => undefined };

function row(overrides: Partial<DedupeCandidateRow> & { id: string; headline: string }): DedupeCandidateRow {
  return {
    summary: 'Summary.',
    detail: 'Detail.',
    sources: [{ outletName: 'Billboard', url: 'https://billboard.com/x', tier: 'established' }],
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

const moment = {
  id: 'tloas-toy-story-5-abigail',
  eraId: 'tloas',
  date: '2026-11-01',
  title: 'At a Toy Story 5 screening, Taylor tells the room about Abigail',
  summary: 'Taylor shares a story about her friend Abigail.',
};
const abigailItem = {
  headline: 'Taylor describes a playful habit she shares with friend Abigail Anderson',
  summary: 'At a screening, Taylor told the room about a habit she shares with Abigail.',
  detail: 'Detail.',
  observedOn: '2026-11-02',
};

afterEach(() => vi.unstubAllEnvs());

describe('30-day window', () => {
  it('uses a 30 day cutoff when loading candidates', async () => {
    expect(CANDIDATE_WINDOW_DAYS).toBe(30);
    let cutoff = '';
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      is: () => chain,
      gt: () => chain,
      order: () => chain,
      gte: (_column: string, value: string) => {
        cutoff = value;
        return chain;
      },
      limit: () => chain,
      then: (resolve: (result: { data: never[]; error: null }) => void) => resolve({ data: [], error: null }),
    };
    const db = { from: () => chain } as unknown as Parameters<typeof loadDedupeCandidates>[0];
    await loadDedupeCandidates(db, 'tloas');
    const days = (Date.now() - Date.parse(cutoff)) / 86_400_000;
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThan(31);
  });
});

describe('shortlist union', () => {
  it('admits an entity-overlap candidate with zero lexical overlap', () => {
    const rows = [
      ...Array.from({ length: 6 }, (_, i) => row({ id: `lex-${i}`, headline: `Trump campaign video ${i}`, summary: 'song removed' })),
      row({ id: 'ent', headline: 'Zzzz qqqq', summary: 'Yyyy', entities: ['Travis Kelce', 'Arrowhead Stadium'] }),
    ];
    const shortlist = shortlistCandidates(
      { headline: 'Trump campaign video song removed', summary: '', entities: ['travis kelce', 'Arrowhead Stadium.'] },
      rows,
    );
    expect(shortlist.map((r) => r.id)).toContain('ent');
  });

  it('does not count the universal Taylor Swift entity', () => {
    const rows = [row({ id: 'e', headline: 'Zzzz', summary: 'Yyyy', entities: ['Taylor Swift', 'Travis Kelce'] })];
    const out = shortlistCandidates(
      { headline: 'Qqqq', summary: 'Wwww', entities: ['Taylor Swift', 'Travis Kelce'] },
      rows,
      0,
    );
    expect(out).toEqual([]);
  });

  it('admits a fact-overlap candidate (exact and Jaccard >= 0.8)', () => {
    const rows = [
      row({ id: 'exact', headline: 'Zzzz', summary: 'Yyyy', facts: [fact('f1', 'Taylor attended the Chiefs game on 2026-11-02.')] }),
      row({ id: 'near', headline: 'Xxxx', summary: 'Vvvv', facts: [fact('f1', 'Swift joined the Eras collaboration with the label on Friday night')] }),
      row({ id: 'none', headline: 'Wwww', summary: 'Uuuu', facts: [fact('f1', 'Something else entirely')] }),
    ];
    const out = shortlistCandidates({
      headline: 'Qqqq', summary: 'Pppp',
      facts: [
        fact('f1', 'taylor attended the chiefs game on 2026 11 02'),
        fact('f2', 'Swift joined the Eras collaboration with the label on Friday night!'),
      ],
    }, rows, 0);
    expect(out.map((r) => r.id).sort()).toEqual(['exact', 'near']);
  });

  it('caps the union at 10', () => {
    const rows = Array.from({ length: 30 }, (_, i) => row({
      id: `r${i}`, headline: `Story ${i}`, summary: 'Same words here', entities: ['Alpha Beta', 'Gamma Delta'],
    }));
    const out = shortlistCandidates({
      headline: 'Story', summary: 'Same words here', entities: ['Alpha Beta', 'Gamma Delta'],
    }, rows);
    expect(out).toHaveLength(10);
  });
});

describe('cross-lane candidates', () => {
  it('discards a news item that duplicates a vault moment (Abigail pair)', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const usage = await ExtractUsageStore.create(usageDb);
    const claude = claudeReturning({
      same_event: true, match_id: `moment:${moment.id}`, adds_new_info: false, new_facts: [],
    });
    const decision = await evaluateSameEventGate(usage, [], abigailItem, claude, {
      eraId: 'tloas',
      crossLane: { moments: [moment] },
    });
    expect(decision).toMatchObject({
      action: 'discard',
      reason: `duplicate_of_moment:${moment.id}`,
      momentId: moment.id,
    });
  });

  it('ignores moments outside the +/-14 day window or era', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const usage = await ExtractUsageStore.create(usageDb);
    const claude = claudeReturning({});
    const decision = await evaluateSameEventGate(usage, [], abigailItem, claude, {
      eraId: 'tloas',
      crossLane: { moments: [{ ...moment, date: '2026-10-10' }, { ...moment, eraId: 'folklore' }] },
    });
    expect(decision).toEqual({ action: 'publish' });
    expect(claude).not.toHaveBeenCalled();
  });

  it('returns attach_video when a vault video matches', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const usage = await ExtractUsageStore.create(usageDb);
    const claude = claudeReturning({
      same_event: true, match_id: 'video:abc123XYZ_-', adds_new_info: false, new_facts: [],
    });
    const decision = await evaluateSameEventGate(usage, [], {
      headline: 'Taylor Swift releases the Opalite music video',
      summary: 'The Opalite video is out.',
      detail: 'Detail.',
    }, claude, {
      eraId: 'tloas',
      crossLane: { videos: [{ videoId: 'abc123XYZ_-', eraId: 'tloas', title: 'Taylor Swift - Opalite (Official Music Video)' }] },
    });
    expect(decision).toEqual({ action: 'attach_video', videoId: 'abc123XYZ_-' });
  });
});

describe('merge path', () => {
  const gateYes = (id: string) => ({
    same_event: true, match_id: id, adds_new_info: true, new_facts: ['a new fact'],
  });

  it('v2 merge appends facts and sources with no prose rewrite and no merge call', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const usage = await ExtractUsageStore.create(usageDb);
    const claude = claudeReturning(gateYes('o1'));
    const original = row({
      id: 'o1', headline: 'Song pulled from campaign video',
      facts: [fact('f1', 'The song was removed from the video.')],
    });
    const decision = await evaluateSameEventGate(usage, [original], {
      headline: 'Campaign removes song', summary: 'Removed.', detail: 'Detail.',
      facts: [
        fact('f1', 'The song was removed from the video'),
        fact('f2', 'The campaign promised not to use it again.'),
      ],
    }, claude, {
      newItemSources: [
        { outletName: 'Billboard', url: 'https://billboard.com/y', tier: 'established' },
        { outletName: 'Variety', url: 'https://variety.com/z', tier: 'established' },
      ],
    });
    expect(claude).toHaveBeenCalledTimes(1);
    expect(decision).toMatchObject({ action: 'merge', candidateId: 'o1', needsRewrite: true });
    if (decision.action !== 'merge') throw new Error('unreachable');
    expect(decision.mergedSummary).toBeUndefined();
    expect(decision.mergedDetail).toBeUndefined();
    expect(decision.mergedFacts?.map((f) => [f.id, f.claim])).toEqual([
      ['f1', 'The song was removed from the video.'],
      ['f2', 'The campaign promised not to use it again.'],
    ]);
    expect(decision.mergedSources?.map((s) => s.outletName)).toEqual(['Billboard', 'Variety']);
  });

  it('v2 merge with no genuinely new fact discards', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const usage = await ExtractUsageStore.create(usageDb);
    const decision = await evaluateSameEventGate(usage, [row({
      id: 'o1', headline: 'Song pulled', facts: [fact('f1', 'The song was removed.')],
    })], {
      headline: 'Song pulled', summary: 'x', detail: 'x', facts: [fact('f1', 'The song was removed')],
    }, claudeReturning(gateYes('o1')));
    expect(decision).toEqual({ action: 'discard', candidateId: 'o1' });
  });

  it('legacy original (no facts) still rewrites prose', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const usage = await ExtractUsageStore.create(usageDb);
    const claude = claudeReturning(gateYes('o1'), {
      summary: 'S'.repeat(200),
      detail: Array(70).fill('grounded').join(' '),
    });
    const decision = await evaluateSameEventGate(usage, [row({ id: 'o1', headline: 'Song pulled' })], {
      headline: 'Song pulled', summary: 'x', detail: 'x', facts: [fact('f1', 'New claim')],
    }, claude);
    expect(decision).toMatchObject({ action: 'merge', candidateId: 'o1', mergedSummary: 'S'.repeat(200) });
    expect(decision).not.toHaveProperty('needsRewrite');
  });
});

describe('mergeFactLists', () => {
  it('dedupes sources by URL and by outlet', () => {
    const out = mergeFactLists([], [], [
      { outletName: 'Billboard', url: 'https://a.com/1', tier: 'established' },
    ], [
      { outletName: 'billboard ', url: 'https://a.com/2', tier: 'established' },
      { outletName: 'Rolling Stone', url: 'https://a.com/1', tier: 'established' },
      { outletName: 'Rolling Stone', url: 'https://rs.com/1', tier: 'established' },
    ]);
    expect(out.mergedSources.map((s) => s.url)).toEqual(['https://a.com/1', 'https://rs.com/1']);
  });
});

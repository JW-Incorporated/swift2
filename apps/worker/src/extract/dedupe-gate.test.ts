import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkerClaudeCaller } from '../claude-call';
import {
  evaluateSameEventGate,
  mergeOutputWithinLimits,
  shortlistCandidates,
  type DedupeCandidateRow,
} from './dedupe-gate';
import { ExtractUsageStore, type UsageDb } from './usage-store';

function unlimitedUsageDb(): UsageDb {
  return { todaysCallCount: async () => 0, incrementToday: async () => undefined };
}

function candidate(
  overrides: Partial<DedupeCandidateRow> & { id: string; headline: string },
): DedupeCandidateRow {
  return {
    summary: 'A summary.',
    detail: 'A detail paragraph.',
    sources: [{
      outletName: 'Billboard',
      url: 'https://billboard.com/x',
      tier: 'established',
    }],
    imageUrl: null,
    heat: 1,
    ...overrides,
  };
}

function fakeClaude(...data: unknown[]) {
  return vi.fn()
    .mockImplementationOnce(async () => ({ status: 'ok', data: data[0] }))
    .mockImplementationOnce(async () => ({ status: 'ok', data: data[1] })) as WorkerClaudeCaller;
}

afterEach(() => vi.unstubAllEnvs());

describe('same-event dedupe fixtures', () => {
  it('merges new facts into a matching Trump-video event', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const originalId = 'ci-trump-video-1';
    const candidates = [candidate({
      id: originalId,
      headline: "Taylor Swift's song pulled from Trump campaign video",
      summary: 'A Taylor Swift song was removed after objection.',
      detail: 'The campaign used the song without permission; it was taken down.',
    })];
    const claude = fakeClaude(
      {
        same_event: true,
        match_id: originalId,
        adds_new_info: true,
        new_facts: ['The campaign confirmed it will not use the song again.'],
      },
      {
        summary: 'A Taylor Swift song was removed from a Trump campaign video after objection, and the campaign has now confirmed it will not use the song again, closing out the dispute.',
        detail: Array(65).fill('grounded').join(' '),
      },
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const decision = await evaluateSameEventGate(usage, candidates, {
      headline: 'Trump campaign removes Taylor Swift song after she objects',
      summary: 'The campaign removed the song.',
      detail: 'The campaign confirmed it will not use the song again.',
    }, claude);
    expect(decision).toMatchObject({ action: 'merge', candidateId: originalId });
    expect(claude).toHaveBeenNthCalledWith(1, expect.objectContaining({
      caller: 'news-worker-dedupe',
      priority: 'P1',
      model: 'claude-haiku-5-5',
    }));
  });

  it('discards a duplicate with no new information', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const originalId = 'ci-trump-video-1';
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const decision = await evaluateSameEventGate(
      usage,
      [candidate({ id: originalId, headline: 'Trump video drops Swift song' })],
      { headline: 'Same event', summary: 'Same facts.', detail: 'Nothing new.' },
      fakeClaude({
        same_event: true,
        match_id: originalId,
        adds_new_info: false,
        new_facts: [],
      }),
    );
    expect(decision).toEqual({ action: 'discard', candidateId: originalId });
  });

  it('publishes a genuine lawsuit follow-up', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const decision = await evaluateSameEventGate(
      usage,
      [candidate({ id: 'ci-1', headline: 'Song removed from campaign video' })],
      {
        headline: 'Taylor Swift files lawsuit over campaign video',
        summary: 'A new legal development.',
        detail: 'The lawsuit follows the removal.',
      },
      fakeClaude({
        same_event: false,
        match_id: null,
        adds_new_info: false,
        new_facts: [],
      }),
    );
    expect(decision.action).toBe('publish');
  });

  it('fails closed when the subscription token is missing', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', '');
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const decision = await evaluateSameEventGate(
      usage,
      [candidate({ id: 'ci-1', headline: 'Some live item' })],
      { headline: 'Restated item', summary: 'Same summary.', detail: 'Same detail.' },
      fakeClaude({}),
    );
    expect(decision.action).toBe('hold');
  });

  it('fails closed and logs when the wrapper reaches a limit', async () => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const claude = vi.fn().mockResolvedValue({
      status: 'unavailable',
      reason: 'limit',
    }) as WorkerClaudeCaller;
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const decision = await evaluateSameEventGate(
      usage,
      [candidate({ id: 'ci-1', headline: 'Some live item' })],
      { headline: 'Restated item', summary: 'Same summary.', detail: 'Same detail.' },
      claude,
    );
    expect(decision.action).toBe('hold');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('deferred'));
    warn.mockRestore();
  });

  it('publishes without a model call when there are no candidates', async () => {
    const claude = fakeClaude({});
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const decision = await evaluateSameEventGate(
      usage,
      [],
      { headline: 'Brand new', summary: 'New.', detail: 'New detail.' },
      claude,
    );
    expect(decision.action).toBe('publish');
    expect(claude).not.toHaveBeenCalled();
  });
});

describe('mergeOutputWithinLimits', () => {
  it('accepts in-range output', () => {
    expect(mergeOutputWithinLimits({
      summary: 'x'.repeat(200),
      detail: Array(100).fill('word').join(' '),
    })).toBe(true);
  });

  it.each([
    ['short summary', 'x', 100],
    ['long summary', 'x'.repeat(401), 100],
    ['short detail', 'x'.repeat(200), 10],
    ['long detail', 'x'.repeat(200), 200],
  ])('rejects %s', (_name, summary, words) => {
    expect(mergeOutputWithinLimits({
      summary,
      detail: Array(words).fill('word').join(' '),
    })).toBe(false);
  });
});

describe('shortlistCandidates', () => {
  it('caps and ranks candidates by overlap', () => {
    const candidates = [
      candidate({ id: 'unrelated', headline: 'A merch drop' }),
      candidate({ id: 'related', headline: 'Taylor Swift song removed from Trump campaign video' }),
      ...Array.from({ length: 18 }, (_, index) => candidate({
        id: `ci-${index}`,
        headline: `Other story ${index}`,
      })),
    ];
    const shortlist = shortlistCandidates({
      headline: 'Trump campaign removes Taylor Swift song after objection',
      summary: '',
    }, candidates);
    expect(shortlist).toHaveLength(5);
    expect(shortlist[0]?.id).toBe('related');
  });
});

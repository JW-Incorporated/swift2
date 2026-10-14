// Content fix 7 fixture tests (spec "Tests" section):
// - three "song removed from Trump video" headlines collapse to one item
//   with new facts merged in
// - two "Nashville Songwriters Hall of Fame" headlines collapse to one item
// - a genuine follow-up ("Swift files lawsuit") stays a separate item
// - LLM failure leads to hold, not publish
// - merge output keeps length limits and adds no facts absent from the inputs

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  evaluateSameEventGate,
  mergeOutputWithinLimits,
  shortlistCandidates,
  type DedupeCandidateRow,
} from './dedupe-gate';
import { ExtractUsageStore, type UsageDb } from './usage-store';

function unlimitedUsageDb(): UsageDb {
  return {
    async todaysCallCount() {
      return 0;
    },
    async incrementToday() {},
  };
}

function toolUseResponse(toolName: string, input: unknown) {
  return {
    ok: true,
    json: async () => ({ content: [{ type: 'tool_use', name: toolName, input }] }),
  };
}

const ORIGINAL_KEY = process.env.ANTHROPIC_API_KEY;

function candidate(overrides: Partial<DedupeCandidateRow> & { id: string; headline: string }): DedupeCandidateRow {
  return {
    summary: 'A summary.',
    detail: 'A detail paragraph.',
    sources: [{ outletName: 'Billboard', url: 'https://billboard.com/x', tier: 'established' }],
    imageUrl: null,
    heat: 1,
    ...overrides,
  };
}

describe('Content fix 7 — same-event dedupe fixtures', () => {
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
    vi.unstubAllGlobals();
  });

  it('collapses the three "song removed from Trump video" headlines to one item, merging new facts', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const originalId = 'ci-trump-video-1';
    const candidates = [
      candidate({
        id: originalId,
        headline: "Taylor Swift's song pulled from Trump campaign video",
        summary: 'A Taylor Swift song was removed from a video posted by the Trump campaign after objection.',
        detail: 'The campaign used the song without permission; it was taken down shortly after.',
      }),
    ];
    // Outlet #2's wording of the SAME event, now coming through extraction.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        toolUseResponse('check_same_event', {
          same_event: true,
          match_id: originalId,
          adds_new_info: true,
          new_facts: ['The campaign confirmed it will not use the song again.'],
        }),
      ).mockResolvedValueOnce(
        toolUseResponse('rewrite_item', {
          summary:
            'A Taylor Swift song was removed from a Trump campaign video after objection, and the campaign has now confirmed it will not use the song again, closing out the dispute.',
          detail:
            'The campaign used the song without permission in a video; it was taken down shortly after the objection was raised. The campaign has since confirmed publicly that it will not use the song again going forward, addressing the controversy directly and closing out what had become a widely covered public dispute between the artist and the political campaign over the unauthorized use.',
        }),
      ),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const decision = await evaluateSameEventGate(usage, candidates, {
      headline: 'Trump campaign removes Taylor Swift song after she objects',
      summary: 'Trump campaign removes a Taylor Swift song from a video after she objected to its use.',
      detail: 'The campaign confirmed it will not use the song again.',
    });
    expect(decision.action).toBe('merge');
    expect(decision.action === 'merge' && decision.candidateId).toBe(originalId);
    expect(decision.action === 'merge' && decision.mergedSummary).toContain('confirmed');
  });

  it('collapses a third outlet\'s report of the same Trump-video event too (discard-only, no new info)', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const originalId = 'ci-trump-video-1';
    const candidates = [
      candidate({
        id: originalId,
        headline: "Taylor Swift's song pulled from Trump campaign video",
        summary: 'A Taylor Swift song was removed from a video posted by the Trump campaign after objection.',
      }),
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        toolUseResponse('check_same_event', {
          same_event: true,
          match_id: originalId,
          adds_new_info: false,
          new_facts: [],
        }),
      ),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const decision = await evaluateSameEventGate(usage, candidates, {
      headline: 'Trump video drops Swift song amid backlash',
      summary: 'A third outlet reports the same removal with no new details.',
      detail: 'Nothing new here.',
    });
    expect(decision.action).toBe('discard');
    expect(decision.action === 'discard' && decision.candidateId).toBe(originalId);
  });

  it('collapses the two Nashville Songwriters Hall of Fame headlines to one item', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const originalId = 'ci-songwriters-hof-1';
    const candidates = [
      candidate({
        id: originalId,
        headline: 'Taylor Swift becomes youngest inductee into Nashville Songwriters Hall of Fame',
        summary: 'Taylor Swift was inducted into the Nashville Songwriters Hall of Fame as its youngest-ever member.',
      }),
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        toolUseResponse('check_same_event', {
          same_event: true,
          match_id: originalId,
          adds_new_info: false,
          new_facts: [],
        }),
      ),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const decision = await evaluateSameEventGate(usage, candidates, {
      headline: 'Taylor Swift inducted into Nashville Songwriters Hall of Fame, youngest ever',
      summary: 'A second outlet covers the same Hall of Fame induction.',
      detail: 'Same ceremony, same honor.',
    });
    expect(decision.action).toBe('discard');
    expect(decision.action === 'discard' && decision.candidateId).toBe(originalId);
  });

  it('keeps a genuine follow-up ("Swift files lawsuit") as a SEPARATE item', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const originalId = 'ci-trump-video-1';
    const candidates = [
      candidate({
        id: originalId,
        headline: "Taylor Swift's song pulled from Trump campaign video",
        summary: 'A Taylor Swift song was removed from a video posted by the Trump campaign after objection.',
      }),
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        toolUseResponse('check_same_event', {
          same_event: false,
          match_id: null,
          adds_new_info: false,
          new_facts: [],
        }),
      ),
    );
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const decision = await evaluateSameEventGate(usage, candidates, {
      headline: 'Taylor Swift files lawsuit over campaign video',
      summary: 'Taylor Swift has filed a lawsuit against the campaign over the unauthorized use of her song.',
      detail: 'This is a new legal development following the earlier song removal.',
    });
    expect(decision.action).toBe('publish');
  });

  it('fails CLOSED to hold — never publishes — when the LLM key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const candidates = [candidate({ id: 'ci-1', headline: 'Some live item' })];
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const decision = await evaluateSameEventGate(usage, candidates, {
      headline: 'Some live item, restated',
      summary: 'A near-identical restatement of the same headline and summary text.',
      detail: 'Detail text.',
    });
    expect(decision.action).toBe('hold');
  });

  it('fails CLOSED to hold — never publishes — on a genuine API error', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' }));
    const candidates = [candidate({ id: 'ci-1', headline: 'Some live item' })];
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const decision = await evaluateSameEventGate(usage, candidates, {
      headline: 'Some live item, restated',
      summary: 'A near-identical restatement of the same headline and summary text.',
      detail: 'Detail text.',
    });
    expect(decision.action).toBe('hold');
  });

  it('publishes (no gate call at all) when there are no live candidates', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const usage = await ExtractUsageStore.create(unlimitedUsageDb());
    const decision = await evaluateSameEventGate(usage, [], {
      headline: 'Brand new story',
      summary: 'Nothing like this is live yet.',
      detail: 'Detail.',
    });
    expect(decision.action).toBe('publish');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('mergeOutputWithinLimits', () => {
  it('accepts a summary 160-400 chars and a detail 60-150 words', () => {
    const summary = 'x'.repeat(200);
    const detail = Array(100).fill('word').join(' ');
    expect(mergeOutputWithinLimits({ summary, detail })).toBe(true);
  });

  it('rejects a summary under 160 chars', () => {
    expect(mergeOutputWithinLimits({ summary: 'too short', detail: Array(100).fill('word').join(' ') })).toBe(false);
  });

  it('rejects a summary over 400 chars', () => {
    expect(mergeOutputWithinLimits({ summary: 'x'.repeat(401), detail: Array(100).fill('word').join(' ') })).toBe(
      false,
    );
  });

  it('rejects a detail under 60 words', () => {
    expect(mergeOutputWithinLimits({ summary: 'x'.repeat(200), detail: Array(10).fill('word').join(' ') })).toBe(
      false,
    );
  });

  it('rejects a detail over 150 words', () => {
    expect(mergeOutputWithinLimits({ summary: 'x'.repeat(200), detail: Array(200).fill('word').join(' ') })).toBe(
      false,
    );
  });
});

describe('shortlistCandidates', () => {
  it('never sends more than the configured max to the LLM', () => {
    const candidates = Array.from({ length: 20 }, (_, i) =>
      candidate({ id: `ci-${i}`, headline: `Taylor Swift story number ${i} about something` }),
    );
    const shortlist = shortlistCandidates(
      { headline: 'Taylor Swift story number 5 about something', summary: 'x' },
      candidates,
    );
    expect(shortlist.length).toBeLessThanOrEqual(5);
  });

  it('ranks by headline+summary overlap, most similar first', () => {
    const candidates = [
      candidate({ id: 'unrelated', headline: 'A totally unrelated topic about merch drops' }),
      candidate({ id: 'related', headline: 'Taylor Swift song removed from Trump campaign video' }),
    ];
    const shortlist = shortlistCandidates(
      { headline: 'Trump campaign removes Taylor Swift song after objection', summary: '' },
      candidates,
      2,
    );
    expect(shortlist[0]!.id).toBe('related');
  });
});

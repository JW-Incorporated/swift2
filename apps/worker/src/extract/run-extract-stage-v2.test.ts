import type { SupabaseClient } from '@supabase/supabase-js';
import { splitSentences } from '@swift2/shared';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  extractWithLLM: vi.fn(),
  writePost: vi.fn(),
  judgeWriting: vi.fn(),
  loadClusterSources: vi.fn(),
  resolveClusterSources: vi.fn(),
  resolveImageUrl: vi.fn(),
  evaluateSameEventGate: vi.fn(),
  storyMarks: { count: 0 },
  mergeNewFactsIntoOriginal: vi.fn(),
  updates: [] as unknown[],
  storyPatches: [] as Record<string, unknown>[],
  pending: [] as Record<string, unknown>[],
  writerCapacity: { value: true },
  publishedToday: { count: 0 },
}));

vi.mock('./held-image-pass', () => ({ reresolveHeldImages: async () => ({ checked: 0, published: 0, errors: [] }) }));
vi.mock('./held-theory-image-pass', () => ({
  reresolveHeldTheoryImages: async () => ({ checked: 0, published: 0, holdReasons: {}, errors: [] }),
}));
vi.mock('./extract-stage-maintenance', () => ({
  runExtractMaintenance: async () => ({ abandonedTheories: 0, countdownsResolved: 0, errors: [] }),
}));
vi.mock('./haiku-client', () => ({ extractWithLLM: mocks.extractWithLLM }));
vi.mock('./writer-client', () => ({ writePost: mocks.writePost }));
vi.mock('./judge-client', () => ({ judgeWriting: mocks.judgeWriting }));
vi.mock('./context-loader', () => ({
  loadEraContext: async () => ({ eraName: 'The Life of a Showgirl era', eraSummary: 'Her current era.', moments: [], crossLane: { moments: [], videos: [] } }),
  loadPriorItems: async () => [],
}));
vi.mock('./image-resolve', () => ({ resolveImageUrl: mocks.resolveImageUrl }));
vi.mock('./dedupe-gate', () => ({
  loadDedupeCandidates: async () => [],
  evaluateSameEventGate: mocks.evaluateSameEventGate,
}));
vi.mock('./usage-store', () => ({
  ExtractUsageStore: { create: async () => ({ hasCapacity: () => mocks.writerCapacity.value }) },
  supabaseExtractUsageDb: () => ({}),
  supabaseWriterUsageDb: () => ({}),
  supabaseJudgeUsageDb: () => ({}),
  JUDGE_PER_RUN_CAP: 100,
  JUDGE_DAILY_CAP: 400,
  WRITER_PER_RUN_CAP: 40,
  WRITER_DAILY_CAP: 150,
}));
vi.mock('./extract-stage-data', () => ({
  createCommentFetchState: () => ({}),
  loadRawItems: async () => [],
  loadClusterSources: mocks.loadClusterSources,
  resolveClusterSources: mocks.resolveClusterSources,
  loadCommentThreads: async () => [],
}));
vi.mock('../sources/fetch-article-text', () => ({ fetchTopArticleTexts: async () => [] }));
vi.mock('./write-knowledge', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./write-knowledge')>()),
  projectKnowledgeDoc: async () => undefined,
  mergeNewFactsIntoOriginal: mocks.mergeNewFactsIntoOriginal,
}));

import { runExtractStage } from './run-extract-stage';

const SOURCES = [
  { outletName: 'People', url: 'https://people.com/a', tier: 'established' },
  { outletName: 'Variety', url: 'https://variety.com/b', tier: 'established' },
];
const THIN_SOURCES = [{ outletName: 'A Blog', url: 'https://blog.example.com/a', tier: 'unverified' }];

const FACTS = [
  { id: 'f1', claim: 'Taylor was photographed outside Blackbird Studio in Nashville.', attribution: 'People', confidence: 'reported' },
  { id: 'f2', claim: 'She left about three hours later.', attribution: 'People', confidence: 'reported' },
];

const PASS_A_SUMMARY = 'Pass A summary sentence one. Pass A summary sentence two is a little longer than the first so it reads like prose does, and a third clause pushes it past the legacy character floor.';
const PASS_A_DETAIL = 'Pass A detail text stays on a held row only. ' + 'It is filler that never ships. '.repeat(14);

const ITEM = {
  observedOn: '2026-11-03',
  category: 'sighting',
  tags: ['Music'],
  headline: 'Taylor spotted outside a Nashville studio',
  summary: PASS_A_SUMMARY,
  detail: PASS_A_DETAIL,
  symbols: [],
  entities: ['Blackbird Studio'],
  statusHint: 'reported',
  facts: FACTS,
};

const LEAD =
  'Taylor stepped into a quiet Nashville recording room this week, and the photos that followed have fans wondering what the next chapter of The Life of a Showgirl might sound like. The visit was brief, but the timing lands in a stretch of careful silence.';
const BODY =
  'The photos show Taylor outside Blackbird Studio in Nashville on Tuesday afternoon. She arrived with a small group and left roughly three hours later. Neither her team nor the studio has said what the session was for. Blackbird has hosted sessions for artists across country and pop for decades. Fans noticed the visit within hours and began comparing it with earlier studio sightings. Last autumn the album rollout began with a similarly quiet stretch of studio rumors. That history is why one afternoon outside a recording room now draws such attention. For now the only detail anyone can confirm is the location and the day. Everything about the purpose stays open until Taylor or her representatives say otherwise. Watch her official channels over the coming days, since announcements for this era have usually landed with very little warning, often on a weekday morning.';

function draft(lead = LEAD, body = BODY) {
  return {
    status: 'ok' as const,
    draft: {
      lead,
      body,
      citations: splitSentences(body).map((_, sentence) => ({ sentence, ref: 'f1' })),
      paragraphs: [{ sentences: splitSentences(body).map((text) => ({ text, refs: ['f1'] })) }],
    },
  };
}

const PASS = {
  status: 'ok' as const,
  pass: true,
  writingScore: 4,
  scores: { voice: 4, context: 5, grounding: 4, non_repetition: 5 },
  reasons: { voice: '', context: '', grounding: '', non_repetition: '' },
};
const FAIL = {
  status: 'ok' as const,
  pass: false,
  writingScore: 2,
  scores: { voice: 4, context: 4, grounding: 2, non_repetition: 4 },
  reasons: { voice: '', context: '', grounding: 'states a number the facts do not give', non_repetition: '' },
};

function chain(result: { data?: unknown; count?: number; error?: unknown }) {
  const query: Record<string, unknown> = { then: (resolve: (value: typeof result) => void) => resolve(result) };
  for (const method of ['eq', 'is', 'limit', 'not', 'select', 'update', 'gte', 'order', 'overlaps', 'or']) {
    query[method] = () => query;
  }
  return query;
}

const ORIGINAL = {
  headline: 'Original headline',
  summary: 'Original lead',
  detail: 'Original body',
  sources: SOURCES,
  image_url: 'https://www.people.com/o.jpg',
};

function markable() {
  const query = chain({ data: [{ id: 'story-1' }], error: null });
  query.update = (patch: Record<string, unknown>) => {
    mocks.storyPatches.push(patch);
    if (patch.extracted_at) mocks.storyMarks.count++;
    return query;
  };
  return query;
}

function fakeDb(inserted: Record<string, unknown>[]): SupabaseClient {
  let storyCalls = 0;
  return {
    from: vi.fn((table: string) => {
      if (table === 'symbol_lexicon') return chain({ data: [], error: null });
      if (table === 'news_story') {
        storyCalls++;
        return storyCalls === 1
          ? chain({ data: mocks.pending, error: null })
          : markable();
      }
      if (table === 'current_item') {
        return {
          select: (_columns: string, options?: { head?: boolean }) => options?.head
            ? chain({ count: mocks.publishedToday.count, error: null })
            : { eq: () => ({ single: async () => ({ data: ORIGINAL, error: null }) }) },
          update: (patch: unknown) => {
            mocks.updates.push(patch);
            return { eq: () => ({ is: async () => ({ error: null }) }) };
          },
          insert: (row: Record<string, unknown>) => {
            inserted.push(row);
            return { select: () => ({ single: async () => ({ data: { id: 'ci-1' }, error: null }) }) };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
  } as unknown as SupabaseClient;
}

async function run(item: unknown = ITEM, sources: unknown[] = SOURCES) {
  mocks.extractWithLLM.mockResolvedValue({ kind: 'current_item', currentItem: item, redlineFlags: [] });
  mocks.loadClusterSources.mockResolvedValue(sources);
  mocks.resolveClusterSources.mockResolvedValue(sources);
  const inserted: Record<string, unknown>[] = [];
  const result = await runExtractStage(fakeDb(inserted));
  return { result, row: inserted[0] };
}

describe('runExtractStage two-pass writer', () => {
  beforeEach(() => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    vi.stubEnv('NEWS_WRITER_V2', 'on');
    mocks.extractWithLLM.mockReset();
    mocks.writePost.mockReset().mockResolvedValue(draft());
    mocks.judgeWriting.mockReset().mockResolvedValue(PASS);
    mocks.evaluateSameEventGate.mockReset().mockResolvedValue({ action: 'publish' });
    mocks.mergeNewFactsIntoOriginal.mockReset().mockResolvedValue({ redlineOk: true });
    mocks.updates.length = 0;
    mocks.storyMarks.count = 0;
    mocks.storyPatches.length = 0;
    mocks.pending = [{ id: 'story-1', canonical_title: 'Studio sighting', summary: '' }];
    mocks.writerCapacity.value = true;
    mocks.publishedToday.count = 0;
    mocks.resolveImageUrl.mockReset().mockResolvedValue('https://www.people.com/photo.jpg');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('happy path: writes lead/body, facts and the judge score, and the row is servable', async () => {
    const { result, row } = await run();
    expect(result.errors).toEqual([]);
    expect(result.extracted).toBe(1);
    expect(row).toMatchObject({
      summary: LEAD,
      detail: BODY,
      facts: FACTS,
      writing_score: 4,
      redline_ok: true,
      quality_hold_reason: null,
    });
    expect(mocks.writePost).toHaveBeenCalledOnce();
    expect(mocks.judgeWriting).toHaveBeenCalledOnce();
  });

  it('lets the 6th item of the day through', async () => {
    mocks.publishedToday.count = 5;
    const { result, row } = await run();
    expect(result.dailyTextCapHeld).toBe(0);
    expect(row).toMatchObject({ summary: LEAD, redline_ok: true, quality_hold_reason: null });
  });

  it('holds the 7th item as daily_text_cap without spending a writer call', async () => {
    mocks.publishedToday.count = 6;
    const { result, row } = await run();
    expect(mocks.writePost).not.toHaveBeenCalled();
    expect(row).toMatchObject({ redline_ok: false, quality_hold_reason: 'daily_text_cap', facts: FACTS });
    expect(result.dailyTextCapHeld).toBe(1);
    expect(result.v2Held).toBe(1);
    expect(result.heldPassReasons).toEqual({ daily_text_cap: 1 });
    expect(mocks.storyMarks.count).toBe(1);
  });

  it('rejects below_tier_floor with no row and no writer call, and marks the story extracted', async () => {
    const { row, result } = await run(ITEM, THIN_SOURCES);
    expect(mocks.writePost).not.toHaveBeenCalled();
    expect(row).toBeUndefined();
    expect(result.v2Held).toBe(1);
    expect(result.heldPassReasons).toEqual({ below_tier_floor: 1 });
    expect(result.screenedOut).toBe(0);
    expect(mocks.storyMarks.count).toBe(1);
  });

  it('writer deferred: no row, story not marked, then the next cycle succeeds', async () => {
    mocks.writePost.mockResolvedValueOnce({ status: 'deferred', reason: 'writer budget exhausted' });
    const first = await run();
    expect(first.row).toBeUndefined();
    expect(first.result.v2Deferred).toBe(1);
    expect(first.result.extracted).toBe(0);
    expect(mocks.storyMarks.count).toBe(0);
    expect(mocks.judgeWriting).not.toHaveBeenCalled();

    const second = await run();
    expect(second.result.extracted).toBe(1);
    expect(second.row).toMatchObject({ summary: LEAD, redline_ok: true });
    expect(mocks.storyMarks.count).toBe(1);
  });

  it('rewrites once with the gate reasons when the writing gate fails, then publishes', async () => {
    mocks.writePost.mockResolvedValueOnce(draft('Too short a lead.')).mockResolvedValueOnce(draft());
    const { row } = await run();
    expect(mocks.writePost).toHaveBeenCalledTimes(2);
    expect(mocks.writePost.mock.calls[1]?.[1].rewriteReasons).toContain('lead_length');
    expect(row).toMatchObject({ summary: LEAD, redline_ok: true, writing_score: 4 });
  });

  it('holds when the writing gate fails twice, counted as v2Held with the reason', async () => {
    mocks.writePost.mockResolvedValue(draft('Too short a lead.'));
    const { row, result } = await run();
    expect(mocks.writePost).toHaveBeenCalledTimes(2);
    expect(mocks.judgeWriting).not.toHaveBeenCalled();
    expect(row).toMatchObject({ redline_ok: false, quality_hold_reason: 'writing_quality:lead_length' });
    expect(result.v2Held).toBe(1);
    expect(result.heldPassReasons).toEqual({ 'writing_quality:lead_length': 1 });
    expect(result.screenedOut).toBe(0);
    expect(mocks.storyMarks.count).toBe(1);
  });

  it('holds with the lowest judge dimension when the judge fails after the one rewrite', async () => {
    mocks.judgeWriting.mockResolvedValue(FAIL);
    const { row } = await run();
    expect(mocks.writePost).toHaveBeenCalledTimes(2);
    expect(mocks.writePost.mock.calls[1]?.[1].rewriteReasons?.[0]).toContain('grounding scored 2/5');
    expect(row).toMatchObject({ redline_ok: false, quality_hold_reason: 'writing_quality:grounding' });
  });

  it('allows only one rewrite in total across the gate and the judge', async () => {
    mocks.writePost.mockResolvedValueOnce(draft('Too short a lead.')).mockResolvedValue(draft());
    mocks.judgeWriting.mockResolvedValue(FAIL);
    const { row } = await run();
    expect(mocks.writePost).toHaveBeenCalledTimes(2);
    expect(mocks.judgeWriting).toHaveBeenCalledOnce();
    expect(row).toMatchObject({ quality_hold_reason: 'writing_quality:grounding' });
  });

  it('judge deferred: no row, story not marked', async () => {
    mocks.judgeWriting.mockResolvedValue({ status: 'deferred', reason: 'budget_exhausted' });
    const { row, result } = await run();
    expect(row).toBeUndefined();
    expect(result.v2Deferred).toBe(1);
    expect(mocks.storyMarks.count).toBe(0);
  });

  it('missing facts: counted, warned, no row, story not marked', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { result, row } = await run({ ...ITEM, facts: undefined });
    expect(result.v2MissingFacts).toBe(1);
    expect(row).toBeUndefined();
    expect(mocks.storyMarks.count).toBe(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('story-1'));
    warn.mockRestore();
  });

  it('missing facts increments v2_attempts and stamps the attempt without marking the story extracted', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.pending = [{ id: 'story-1', canonical_title: 'Studio sighting', summary: '', v2_attempts: 1 }];
    const { result } = await run({ ...ITEM, facts: undefined });
    expect(result.v2GaveUp).toBe(0);
    expect(mocks.storyPatches).toHaveLength(1);
    expect(mocks.storyPatches[0]).toMatchObject({ v2_attempts: 2, v2_last_attempt_at: expect.any(String) });
    expect(mocks.storyPatches[0]).not.toHaveProperty('extracted_at');
  });

  it('gives up at the third missing-facts attempt: marks the story extracted and counts v2GaveUp', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.pending = [{ id: 'story-1', canonical_title: 'Studio sighting', summary: '', v2_attempts: 2 }];
    const { result } = await run({ ...ITEM, facts: undefined });
    expect(result.v2GaveUp).toBe(1);
    expect(result.v2GaveUpReasons).toEqual({ missing_facts: 1 });
    expect(mocks.storyPatches[0]).toMatchObject({ v2_attempts: 3, extracted_at: expect.any(String) });
  });

  it('gives up on a story that keeps deferring, with the deferred reason', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.judgeWriting.mockResolvedValue({ status: 'deferred', reason: 'budget_exhausted' });
    mocks.pending = [{ id: 'story-1', canonical_title: 'Studio sighting', summary: '', v2_attempts: 2 }];
    const { result } = await run();
    expect(result.v2Deferred).toBe(1);
    expect(result.v2GaveUp).toBe(1);
    expect(result.v2GaveUpReasons).toEqual({ deferred: 1 });
    expect(mocks.storyPatches[0]).toMatchObject({ v2_attempts: 3, extracted_at: expect.any(String) });
  });

  it('stops before the pass-A extract call when the writer budget is spent, counting the rest as deferred', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.writerCapacity.value = false;
    mocks.pending = [
      { id: 'story-1', canonical_title: 'One', summary: '' },
      { id: 'story-2', canonical_title: 'Two', summary: '' },
    ];
    const { result } = await run();
    expect(mocks.extractWithLLM).not.toHaveBeenCalled();
    expect(result.writerBudgetExhausted).toBe(true);
    expect(result.deferred).toBe(2);
    expect(result.clustersConsidered).toBe(0);
    expect(mocks.storyPatches).toEqual([]);
    expect(warn.mock.calls.filter(([message]) => String(message).includes('writerBudgetExhausted'))).toHaveLength(1);
  });

  it('defaults to off when NEWS_WRITER_V2 is unset: legacy row, no writer call, no budget check', async () => {
    vi.stubEnv('NEWS_WRITER_V2', undefined);
    mocks.writerCapacity.value = false;
    const { row, result } = await run();
    expect(mocks.writePost).not.toHaveBeenCalled();
    expect(result.writerBudgetExhausted).toBe(false);
    expect(row).toMatchObject({ summary: PASS_A_SUMMARY, redline_ok: true });
  });

  it('NEWS_WRITER_V2=off writes the legacy row: pass-A text, no facts, no writer or judge call', async () => {
    vi.stubEnv('NEWS_WRITER_V2', 'off');
    const { row } = await run();
    expect(mocks.writePost).not.toHaveBeenCalled();
    expect(mocks.judgeWriting).not.toHaveBeenCalled();
    expect(row).not.toHaveProperty('facts');
    expect(row).not.toHaveProperty('writing_score');
    expect(row).toMatchObject({ summary: PASS_A_SUMMARY, detail: PASS_A_DETAIL, redline_ok: true, quality_hold_reason: null });
  });

  it('discards a vault-moment duplicate with no row and passes cross-lane options to the gate', async () => {
    mocks.evaluateSameEventGate.mockResolvedValue({ action: 'discard', candidateId: 'moment:m1', reason: 'duplicate_of_moment:m1', momentId: 'm1' });
    const { result, row } = await run();
    expect(row).toBeUndefined();
    expect(result.dedupeDiscarded).toBe(1);
    expect(result.dedupeDiscardReasons).toEqual({ duplicate_of_moment: 1 });
    expect(result.errors).toEqual([]);
    expect(mocks.evaluateSameEventGate.mock.calls[0]?.[4]).toMatchObject({ eraId: 'tloas', crossLane: { moments: [], videos: [] } });
  });

  it('counts the legacy_item_vs_v2_original discard reason', async () => {
    mocks.evaluateSameEventGate.mockResolvedValue({ action: 'discard', candidateId: 'orig-1', reason: 'legacy_item_vs_v2_original' });
    const { result, row } = await run();
    expect(row).toBeUndefined();
    expect(result.dedupeDiscardReasons).toEqual({ legacy_item_vs_v2_original: 1 });
  });

  it('counts a video match as attached_to_video and writes no row', async () => {
    mocks.evaluateSameEventGate.mockResolvedValue({ action: 'attach_video', videoId: 'v1' });
    const { result, row } = await run();
    expect(row).toBeUndefined();
    expect(result.attachedToVideo).toBe(1);
  });

  it('v2 merge re-runs the writer from the merged facts and writes facts, score and prose in one update', async () => {
    const mergedFacts = [...FACTS, { id: 'f3', claim: 'A third fact.', attribution: 'Variety', confidence: 'reported' }];
    mocks.evaluateSameEventGate.mockResolvedValue({
      action: 'merge', candidateId: 'orig-1', needsRewrite: true, mergedFacts, mergedSources: SOURCES,
    });
    const { result } = await run();
    expect(result.errors).toEqual([]);
    expect(mocks.writePost.mock.calls[0]?.[1].facts).toEqual(mergedFacts);
    expect(mocks.updates).toEqual([]);
    expect(mocks.mergeNewFactsIntoOriginal.mock.calls[0]?.[3]).toMatchObject({
      mergedSummary: LEAD, mergedDetail: BODY, mergedFacts, writingScore: 4,
    });
  });

  it('v2 merge that fails the gate keeps the original copy and only adds sources', async () => {
    mocks.writePost.mockResolvedValue(draft('Too short a lead.'));
    mocks.evaluateSameEventGate.mockResolvedValue({
      action: 'merge', candidateId: 'orig-1', needsRewrite: true, mergedFacts: FACTS, mergedSources: SOURCES,
    });
    await run();
    const input = mocks.mergeNewFactsIntoOriginal.mock.calls[0]?.[3];
    expect(input).not.toHaveProperty('mergedSummary');
    expect(input).not.toHaveProperty('mergedFacts');
    expect(input.duplicateSources).toEqual(SOURCES);
  });

  it('v2 merge with a deferred writer retries: nothing merged, story not marked', async () => {
    mocks.writePost.mockResolvedValue({ status: 'deferred', reason: 'writer budget exhausted' });
    mocks.evaluateSameEventGate.mockResolvedValue({
      action: 'merge', candidateId: 'orig-1', needsRewrite: true, mergedFacts: FACTS, mergedSources: SOURCES,
    });
    const { result } = await run();
    expect(mocks.mergeNewFactsIntoOriginal).not.toHaveBeenCalled();
    expect(result.v2Deferred).toBe(1);
    expect(result.dedupeMerged).toBe(0);
    expect(mocks.storyMarks.count).toBe(0);
  });

});

describe('runExtractStage shadow mode', () => {
  let file: string;
  beforeEach(() => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    file = join(mkdtempSync(join(tmpdir(), 'news-shadow-')), 'shadow.jsonl');
    vi.stubEnv('NEWS_V2_SHADOW_FILE', file);
    mocks.extractWithLLM.mockReset();
    mocks.writePost.mockReset().mockResolvedValue(draft());
    mocks.judgeWriting.mockReset().mockResolvedValue(PASS);
    mocks.resolveImageUrl.mockReset().mockResolvedValue('https://www.people.com/photo.jpg');
    mocks.evaluateSameEventGate.mockReset().mockResolvedValue({ action: 'publish' });
    mocks.mergeNewFactsIntoOriginal.mockReset().mockResolvedValue({ redlineOk: true });
    mocks.updates.length = 0;
    mocks.storyMarks.count = 0;
    mocks.storyPatches.length = 0;
    mocks.pending = [{ id: 'story-1', canonical_title: 'Studio sighting', summary: '' }];
    mocks.writerCapacity.value = true;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('writes the legacy row exactly as off mode does, with no v2 columns or DB writes', async () => {
    vi.stubEnv('NEWS_WRITER_V2', 'off');
    const off = await run();
    vi.stubEnv('NEWS_WRITER_V2', 'shadow');
    const shadow = await run();
    const strip = (r: Record<string, unknown> | undefined) => ({ ...r, expires_at: undefined });
    expect(strip(shadow.row)).toEqual(strip(off.row));
    expect(shadow.row).not.toHaveProperty('facts');
    expect(shadow.row).not.toHaveProperty('writing_score');
    expect(mocks.updates).toEqual([]);
    expect(shadow.result.v2Held + shadow.result.v2Deferred + shadow.result.v2MissingFacts).toBe(0);
    expect(mocks.writePost).toHaveBeenCalledOnce();
  });

  it('a throwing shadow (unwritable file) does not break or skip the legacy write', async () => {
    vi.stubEnv('NEWS_WRITER_V2', 'shadow');
    vi.stubEnv('NEWS_V2_SHADOW_FILE', join(file, '..'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { row, result } = await run();
    expect(row).toMatchObject({ summary: PASS_A_SUMMARY, detail: PASS_A_DETAIL, redline_ok: true });
    expect(result.extracted).toBe(1);
    expect(result.errors).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('v2 shadow failed'));
    expect(mocks.storyPatches).toHaveLength(1);
    expect(mocks.storyPatches[0]).not.toHaveProperty('v2_attempts');
    warn.mockRestore();
  });

  it('appends one JSON line per item with the draft, gate, judge and context ids', async () => {
    vi.stubEnv('NEWS_WRITER_V2', 'shadow');
    await run();
    const lines = readFileSync(file, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(1);
    const line = JSON.parse(lines[0]!);
    expect(Object.keys(line).sort()).toEqual(
      ['body', 'citations', 'contextIds', 'facts', 'headline', 'judgeScores', 'lead', 'outcome', 'paragraphs', 'storyId'].sort(),
    );
    expect(line).toMatchObject({ storyId: 'story-1', headline: ITEM.headline, lead: LEAD, outcome: 'ok' });
    expect(line.body).toBe(BODY);
    expect(line.citations.length).toBeGreaterThan(0);
  });

  it('records a held draft with its gate reasons and a floor rejection', async () => {
    vi.stubEnv('NEWS_WRITER_V2', 'shadow');
    mocks.writePost.mockResolvedValue(draft('Too short a lead.'));
    await run();
    await run(ITEM, THIN_SOURCES);
    const [held, floor] = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(held).toMatchObject({ outcome: 'hold', holdReason: 'writing_quality:lead_length', gateReasons: ['lead_length'] });
    expect(floor).toMatchObject({ outcome: 'below_tier_floor', holdReason: 'below_tier_floor' });
  });
});

import type { SupabaseClient } from '@supabase/supabase-js';
import { splitSentences } from '@swift2/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  extractWithLLM: vi.fn(),
  writePost: vi.fn(),
  judgeWriting: vi.fn(),
  judgeSignificance: vi.fn(),
  loadClusterSources: vi.fn(),
  resolveClusterSources: vi.fn(),
  resolveImageUrl: vi.fn(),
  evaluateSameEventGate: vi.fn(),
  storyMarks: { count: 0 },
  storyPatches: [] as Record<string, unknown>[],
  pending: [] as Record<string, unknown>[],
  publishedToday: { count: 0 },
  missingVerdictColumn: { value: false },
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
vi.mock('./significance-client', () => ({ judgeSignificance: mocks.judgeSignificance }));
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
  ExtractUsageStore: { create: async () => ({ hasCapacity: () => true }) },
  supabaseExtractUsageDb: () => ({}),
  supabaseWriterUsageDb: () => ({}),
  supabaseJudgeUsageDb: () => ({}),
  supabaseSignificanceUsageDb: () => ({}),
  JUDGE_PER_RUN_CAP: 100,
  JUDGE_DAILY_CAP: 400,
  WRITER_PER_RUN_CAP: 40,
  WRITER_DAILY_CAP: 150,
  SIGNIFICANCE_PER_RUN_CAP: 30,
  SIGNIFICANCE_DAILY_CAP: 250,
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
}));

import { runExtractStage } from './run-extract-stage';

const SOURCES = [
  { outletName: 'People', url: 'https://people.com/a', tier: 'established' },
  { outletName: 'Variety', url: 'https://variety.com/b', tier: 'established' },
];
const FACTS = [
  { id: 'f1', claim: 'Taylor announced a new tour date in Toronto.', attribution: 'People', confidence: 'reported' },
  { id: 'f2', claim: 'Tickets go on sale Friday.', attribution: 'People', confidence: 'reported' },
];
const SUMMARY = 'Pass A summary sentence one. Pass A summary sentence two is a little longer than the first so it reads like prose does, and a third clause pushes it past the legacy character floor.';
const DETAIL = 'Pass A detail text stays on a held row only. ' + 'It is filler that never ships. '.repeat(14);

const base = {
  observedOn: '2026-11-08',
  tags: ['Tour'],
  summary: SUMMARY,
  detail: DETAIL,
  symbols: [],
  entities: ['Toronto'],
  statusHint: 'reported',
  facts: FACTS,
};
const TOUR_ITEM = { ...base, category: 'tour', headline: 'Taylor announces a new tour date in Toronto' };
const SIGHTING_ITEM = { ...base, category: 'sighting', headline: 'Taylor spotted outside a Nashville studio' };

const LEAD =
  'Taylor added a Toronto stop to the schedule this week, and fans have been trading ticket plans ever since the date went public, with group chats filling up fast. The announcement came with very little warning, and the on-sale day is now the only thing anyone is talking about.';
const BODY =
  'Taylor announced a new tour date in Toronto on Tuesday. Tickets go on sale Friday according to the announcement. Fans noticed the new stop within hours. The announcement did not say whether more dates would follow. The Toronto stop adds to a schedule that has already filled most weekends. Details on seating and pricing were not part of the first post. Everything beyond the date and the on-sale day stays open for now. Toronto has hosted her shows before and the crowds there have always been loud and loyal. Fans who missed earlier legs are already organizing group chats to coordinate the Friday sale. Nothing about the announcement suggests the plan has changed for the rest of the run. Watch her official channels for the full list of details, since updates have usually landed with very little warning.';

function chain(result: { data?: unknown; count?: number; error?: unknown }) {
  const query: Record<string, unknown> = { then: (resolve: (value: typeof result) => void) => resolve(result) };
  for (const method of ['eq', 'is', 'limit', 'not', 'select', 'update', 'gte', 'order', 'overlaps', 'or']) {
    query[method] = () => query;
  }
  return query;
}

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
        return storyCalls === 1 ? chain({ data: mocks.pending, error: null }) : markable();
      }
      if (table === 'current_item') {
        return {
          select: () => chain({ count: mocks.publishedToday.count, error: null }),
          insert: (row: Record<string, unknown>) => {
            if (mocks.missingVerdictColumn.value && 'significance_verdict' in row) {
              return { select: () => ({ single: async () => ({
                data: null,
                error: { code: '42703', message: 'column "significance_verdict" of relation "current_item" does not exist' },
              }) }) };
            }
            inserted.push(row);
            return { select: () => ({ single: async () => ({ data: { id: 'ci-1' }, error: null }) }) };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
  } as unknown as SupabaseClient;
}

async function run(item: unknown) {
  mocks.extractWithLLM.mockResolvedValue({ kind: 'current_item', currentItem: item, redlineFlags: [] });
  mocks.loadClusterSources.mockResolvedValue(SOURCES);
  mocks.resolveClusterSources.mockResolvedValue(SOURCES);
  const inserted: Record<string, unknown>[] = [];
  const result = await runExtractStage(fakeDb(inserted));
  return { result, row: inserted[0], inserted };
}

const OK = (tier: 1 | 2 | 3) => ({ status: 'ok' as const, tier, reason: `tier ${tier} reason`, model: 'claude-opus-5-5' });

describe('runExtractStage significance gate', () => {
  beforeEach(() => {
    vi.stubEnv('CLAUDE_CODE_OAUTH_TOKEN', 'test-token');
    vi.stubEnv('NEWS_WRITER_V2', 'on');
    vi.stubEnv('NEWS_SIGNIFICANCE', 'on');
    mocks.extractWithLLM.mockReset();
    mocks.writePost.mockReset().mockResolvedValue({
      status: 'ok',
      draft: {
        lead: LEAD,
        body: BODY,
        citations: splitSentences(BODY).map((_, sentence) => ({ sentence, ref: 'f1' })),
        paragraphs: [{ sentences: splitSentences(BODY).map((text) => ({ text, refs: ['f1'] })) }],
      },
    });
    mocks.judgeWriting.mockReset().mockResolvedValue({
      status: 'ok', pass: true, writingScore: 4,
      scores: { voice: 4, context: 5, grounding: 4, non_repetition: 5 },
      reasons: { voice: '', context: '', grounding: '', non_repetition: '' },
    });
    mocks.judgeSignificance.mockReset().mockResolvedValue(OK(1));
    mocks.evaluateSameEventGate.mockReset().mockResolvedValue({ action: 'publish' });
    mocks.storyMarks.count = 0;
    mocks.storyPatches.length = 0;
    mocks.pending = [{ id: 'story-1', canonical_title: 'Tour date', summary: '' }];
    mocks.publishedToday.count = 0;
    mocks.missingVerdictColumn.value = false;
    mocks.resolveImageUrl.mockReset().mockResolvedValue('https://www.people.com/photo.jpg');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('holds a layer-1 rule match as not_notable:<rule> without calling the judge or writer', async () => {
    const { result, row } = await run(SIGHTING_ITEM);
    expect(mocks.judgeSignificance).not.toHaveBeenCalled();
    expect(mocks.writePost).not.toHaveBeenCalled();
    expect(row).toMatchObject({
      redline_ok: false,
      quality_hold_reason: 'not_notable:sighting_no_event',
      significance_verdict: { tier: 3, reason: 'rule:sighting_no_event', model: 'rules' },
    });
    expect(result.significanceHeld).toEqual({ 'not_notable:sighting_no_event': 1 });
    expect(result.tierCounts).toEqual({ '3': 1 });
    expect(result.heldPassReasons).toEqual({ 'not_notable:sighting_no_event': 1 });
    expect(mocks.storyMarks.count).toBe(1);
  });

  it('holds a judge tier 3 as not_notable:judge', async () => {
    mocks.judgeSignificance.mockResolvedValue(OK(3));
    const { result, row } = await run(TOUR_ITEM);
    expect(mocks.writePost).not.toHaveBeenCalled();
    expect(row).toMatchObject({
      redline_ok: false,
      quality_hold_reason: 'not_notable:judge',
      significance_verdict: { tier: 3, model: 'claude-opus-5-5' },
    });
    expect(result.significanceHeld).toEqual({ 'not_notable:judge': 1 });
  });

  it('defers on a judge failure: no row, story not marked, attempt recorded for retry', async () => {
    mocks.judgeSignificance.mockResolvedValue({ status: 'deferred', reason: 'budget_exhausted' });
    const { result, inserted } = await run(TOUR_ITEM);
    expect(inserted).toEqual([]);
    expect(result.significanceDeferred).toBe(1);
    expect(mocks.storyMarks.count).toBe(0);
    expect(mocks.storyPatches).toEqual([expect.objectContaining({ v2_attempts: 1 })]);
  });

  it('publishes a tier 1 item even after 6 text posts, storing its verdict', async () => {
    mocks.publishedToday.count = 6;
    const { result, row } = await run(TOUR_ITEM);
    expect(row).toMatchObject({
      summary: LEAD,
      redline_ok: true,
      quality_hold_reason: null,
      significance_verdict: { tier: 1, reason: 'tier 1 reason', model: 'claude-opus-5-5' },
    });
    expect(result.tierCounts).toEqual({ '1': 1 });
    expect(result.dailyTextCapHeld).toBe(0);
  });

  it('holds a tier 2 item at the tier-2 cap and publishes it below the cap', async () => {
    mocks.judgeSignificance.mockResolvedValue(OK(2));
    mocks.publishedToday.count = 4;
    const capped = await run(TOUR_ITEM);
    expect(mocks.writePost).not.toHaveBeenCalled();
    expect(capped.row).toMatchObject({ redline_ok: false, quality_hold_reason: 'daily_tier2_cap' });
    expect(capped.result.dailyTextCapHeld).toBe(1);

    mocks.publishedToday.count = 3;
    const open = await run(TOUR_ITEM);
    expect(open.row).toMatchObject({ redline_ok: true, significance_verdict: { tier: 2 } });
  });

  it('shadow mode records the verdict and counts the would-be hold but never holds', async () => {
    vi.stubEnv('NEWS_SIGNIFICANCE', 'shadow');
    const { result, row } = await run(SIGHTING_ITEM);
    expect(row).toMatchObject({
      redline_ok: true,
      quality_hold_reason: null,
      significance_verdict: { tier: 3, reason: 'rule:sighting_no_event', model: 'rules' },
    });
    expect(result.significanceHeld).toEqual({ 'not_notable:sighting_no_event': 1 });
    expect(result.v2Held).toBe(0);
    expect(result.extracted).toBe(1);
  });

  it('shadow mode proceeds without a verdict when the judge defers', async () => {
    vi.stubEnv('NEWS_SIGNIFICANCE', 'shadow');
    mocks.judgeSignificance.mockResolvedValue({ status: 'deferred', reason: 'no_token' });
    const { result, row } = await run(TOUR_ITEM);
    expect(row).toMatchObject({ redline_ok: true });
    expect(row).not.toHaveProperty('significance_verdict');
    expect(result.significanceDeferred).toBe(1);
    expect(mocks.storyPatches).toEqual([expect.objectContaining({ extracted_at: expect.any(String) })]);
  });

  it('off mode runs no significance stage', async () => {
    vi.stubEnv('NEWS_SIGNIFICANCE', 'off');
    const { result, row } = await run(SIGHTING_ITEM);
    expect(mocks.judgeSignificance).not.toHaveBeenCalled();
    expect(row).not.toHaveProperty('significance_verdict');
    expect(result.tierCounts).toEqual({});
  });

  it('retries the insert without significance_verdict when the column is missing', async () => {
    mocks.missingVerdictColumn.value = true;
    const { result, row, inserted } = await run(TOUR_ITEM);
    expect(result.errors).toEqual([]);
    expect(inserted).toHaveLength(1);
    expect(row).toMatchObject({ redline_ok: true });
    expect(row).not.toHaveProperty('significance_verdict');
  });
});

import type { SupabaseClient } from '@supabase/supabase-js';
import { splitSentences } from '@swift2/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  extractWithLLM: vi.fn(),
  writePost: vi.fn(),
  judgeWriting: vi.fn(),
  loadClusterSources: vi.fn(),
  resolveClusterSources: vi.fn(),
  resolveImageUrl: vi.fn(),
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
  loadEraContext: async () => ({ eraName: 'The Life of a Showgirl era', eraSummary: 'Her current era.', moments: [] }),
  loadPriorItems: async () => [],
}));
vi.mock('./image-resolve', () => ({ resolveImageUrl: mocks.resolveImageUrl }));
vi.mock('./dedupe-gate', () => ({
  loadDedupeCandidates: async () => [],
  evaluateSameEventGate: async () => ({ action: 'publish' }),
}));
vi.mock('./usage-store', () => ({
  ExtractUsageStore: { create: async () => ({}) },
  supabaseExtractUsageDb: () => ({}),
  supabaseWriterUsageDb: () => ({}),
  WRITER_PER_RUN_CAP: 60,
  WRITER_DAILY_CAP: 200,
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

function chain(result: { data?: unknown; error?: unknown }) {
  const query: Record<string, unknown> = { then: (resolve: (value: typeof result) => void) => resolve(result) };
  for (const method of ['eq', 'is', 'limit', 'not', 'select', 'update', 'gte', 'order', 'overlaps']) {
    query[method] = () => query;
  }
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
          ? chain({ data: [{ id: 'story-1', canonical_title: 'Studio sighting', summary: '' }], error: null })
          : chain({ error: null });
      }
      if (table === 'current_item') {
        return {
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

  it('holds below_tier_floor without calling the writer', async () => {
    const { row, result } = await run(ITEM, THIN_SOURCES);
    expect(mocks.writePost).not.toHaveBeenCalled();
    expect(row).toMatchObject({ redline_ok: false, quality_hold_reason: 'below_tier_floor', facts: FACTS });
    expect(result.screenedOut).toBe(1);
  });

  it('holds writer_deferred and never ships the pass-A text', async () => {
    mocks.writePost.mockResolvedValue({ status: 'deferred', reason: 'writer budget exhausted' });
    const { row } = await run();
    expect(row).toMatchObject({ redline_ok: false, quality_hold_reason: 'writer_deferred', writing_score: null });
    expect(mocks.judgeWriting).not.toHaveBeenCalled();
  });

  it('rewrites once with the gate reasons when the writing gate fails, then publishes', async () => {
    mocks.writePost.mockResolvedValueOnce(draft('Too short a lead.')).mockResolvedValueOnce(draft());
    const { row } = await run();
    expect(mocks.writePost).toHaveBeenCalledTimes(2);
    expect(mocks.writePost.mock.calls[1]?.[1].rewriteReasons).toContain('lead_length');
    expect(row).toMatchObject({ summary: LEAD, redline_ok: true, writing_score: 4 });
  });

  it('holds when the writing gate fails twice', async () => {
    mocks.writePost.mockResolvedValue(draft('Too short a lead.'));
    const { row } = await run();
    expect(mocks.writePost).toHaveBeenCalledTimes(2);
    expect(mocks.judgeWriting).not.toHaveBeenCalled();
    expect(row).toMatchObject({ redline_ok: false, quality_hold_reason: 'writing_quality:lead_length' });
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

  it('holds judge_deferred', async () => {
    mocks.judgeWriting.mockResolvedValue({ status: 'deferred', reason: 'budget_exhausted' });
    const { row } = await run();
    expect(row).toMatchObject({ redline_ok: false, quality_hold_reason: 'judge_deferred' });
  });

  it('skips a current_item that came back with no facts', async () => {
    const { result, row } = await run({ ...ITEM, facts: undefined });
    expect(result.skipped).toBe(1);
    expect(row).toBeUndefined();
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
});

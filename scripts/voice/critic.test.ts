import { describe, expect, it, vi } from 'vitest';
import { reviewDrafts, scoreItems } from './critic.mjs';
import { REWRITE_SCHEMA, SCORE_SCHEMA } from './critic-prompts.mjs';
import { parseCorpus, loadCorpus } from './corpus.mjs';
import { summarize } from './eval-critic.mjs';

type Input = { model: string; user: string; schema: unknown; priority: string; caller: string };
type Scores = Record<string, number>;

const row = (id: string, s: number | Scores) => ({
  id, note: 'n',
  ...(typeof s === 'number'
    ? { love: s, insight: s, opinion: s, clowning: s, ai_tells: s } : s),
});

function ids(user: string) {
  return [...user.matchAll(/<text id="([^"]+)"/g)].map((m) => m[1]);
}

function fake(scoreFor: (id: string, text: string, call: number) => number | Scores) {
  let scoreCalls = 0;
  const fn = vi.fn(async (input: Input) => {
    if (input.model === 'claude-haiku-5-5') {
      scoreCalls += 1;
      const n = scoreCalls;
      const parts = input.user.split('</text>').filter((p) => p.includes('<text id='));
      return {
        status: 'ok',
        data: {
          results: parts.map((p) => {
            const id = /<text id="([^"]+)"/.exec(p)![1];
            return row(id, scoreFor(id, p.split('>\n').slice(1).join('>\n').trim(), n));
          }),
        },
      };
    }
    return {
      status: 'ok',
      data: { rewrites: ids(input.user).map((id) => ({ id, text: `better ${id}` })) },
    };
  });
  return fn;
}

const quiet = { log: () => undefined };
const item = (id: string) => ({ id, text: `text ${id}` });

describe('scoreItems', () => {
  it('sends the strict schema, the Haiku model and a non-backup priority', async () => {
    const call = fake(() => 4);
    const out = await scoreItems([item('a')], { call, ...quiet });
    const input = call.mock.calls[0][0];
    expect(input.model).toBe('claude-haiku-5-5');
    expect(input.schema).toBe(SCORE_SCHEMA);
    expect(['P2', 'P3']).toContain(input.priority);
    expect(out[0]).toMatchObject({ id: 'a', status: 'scored', min: 4 });
  });

  it('batches about ten items per call and keeps input order', async () => {
    const call = fake(() => 4);
    const items = Array.from({ length: 23 }, (_, i) => item(`x${i}`));
    const out = await scoreItems(items, { call, ...quiet });
    expect(call).toHaveBeenCalledTimes(3);
    expect(out.map((o) => o.id)).toEqual(items.map((i) => i.id));
  });

  it('rejects out-of-range scores and missing ids as not scored', async () => {
    const call = vi.fn(async () => ({
      status: 'ok',
      data: { results: [row('a', { love: 9, insight: 3, opinion: 3, clowning: 3, ai_tells: 3 })] },
    }));
    const out = await scoreItems([item('a'), item('b')], { call, ...quiet });
    expect(out.map((o) => o.status)).toEqual(['not_scored', 'not_scored']);
  });

  it('fails open on unavailable and stops calling after the first failure', async () => {
    const call = vi.fn(async () => ({ status: 'unavailable', reason: 'limit' }));
    const log = vi.fn();
    const items = Array.from({ length: 25 }, (_, i) => item(`x${i}`));
    const out = await scoreItems(items, { call, log });
    expect(call).toHaveBeenCalledTimes(1);
    expect(out.every((o) => o.status === 'not_scored')).toBe(true);
    expect(log).toHaveBeenCalled();
  });

  it('has a schema that requires all five dimensions', () => {
    const props = SCORE_SCHEMA.properties.results.items;
    expect(props.required).toEqual(
      ['id', 'love', 'insight', 'opinion', 'clowning', 'ai_tells', 'note'],
    );
    expect(props.additionalProperties).toBe(false);
    expect(REWRITE_SCHEMA.required).toEqual(['rewrites']);
  });
});

describe('reviewDrafts rewrite-once rule', () => {
  it('does not rewrite when every score is >= 3', async () => {
    const call = fake(() => 3);
    const out = await reviewDrafts([item('a'), item('b')], { call, ...quiet });
    expect(call).toHaveBeenCalledTimes(1);
    expect(out.every((o) => !o.rewriteAttempted && o.text === o.original)).toBe(true);
  });

  it('rewrites when any single score is < 3, then re-scores once, using Sonnet', async () => {
    const call = fake((id, _text, n) => (n === 1
      ? { love: 4, insight: 4, opinion: 2, clowning: 4, ai_tells: 4 } : 4));
    const out = await reviewDrafts([item('a')], { call, ...quiet });
    const models = call.mock.calls.map((c) => c[0].model);
    expect(models).toEqual(['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5']);
    expect(out[0]).toMatchObject({ rewritten: true, text: 'better a', original: 'text a' });
    expect(out[0].after?.min).toBe(4);
  });

  it('never rewrites twice when the rewrite still scores < 3', async () => {
    const call = fake(() => 2);
    const out = await reviewDrafts([item('a')], { call, ...quiet });
    const sonnet = call.mock.calls.filter((c) => c[0].model === 'claude-sonnet-5-5');
    expect(sonnet).toHaveLength(1);
    expect(call).toHaveBeenCalledTimes(3);
    expect(out[0]).toMatchObject({ rewriteAttempted: true, rewritten: false, text: 'text a' });
  });

  it('keeps the original when the rewrite is not strictly better', async () => {
    const call = fake((_id, text) => (text.startsWith('better') ? 1 : 2));
    const out = await reviewDrafts([item('a')], { call, ...quiet });
    expect(out[0]).toMatchObject({ rewritten: false, text: 'text a' });
  });

  it('rewrites only the weak items of a mixed batch, in one rewrite call', async () => {
    const call = fake((id) => (id === 'weak1' || id === 'weak2' ? 2 : 4));
    const items = ['ok1', 'weak1', 'ok2', 'weak2'].map(item);
    const out = await reviewDrafts(items, { call, ...quiet });
    const rewriteCall = call.mock.calls.find((c) => c[0].model === 'claude-sonnet-5-5')!;
    expect(ids(rewriteCall[0].user)).toEqual(['weak1', 'weak2']);
    expect(out.find((o) => o.id === 'ok1')!.rewriteAttempted).toBe(false);
  });

  it('fails open to the original draft when scoring is unavailable', async () => {
    const call = vi.fn(async () => ({ status: 'unavailable', reason: 'limit' }));
    const log = vi.fn();
    const out = await reviewDrafts([item('a')], { call, log });
    expect(call).toHaveBeenCalledTimes(1);
    expect(out[0]).toMatchObject({ status: 'not_scored', text: 'text a', rewritten: false });
  });

  it('fails open when the rewrite call is unavailable', async () => {
    const call = vi.fn(async (input: Input) => (input.model === 'claude-haiku-5-5'
      ? { status: 'ok', data: { results: [row('a', 2)] } }
      : { status: 'unavailable', reason: 'limit' }));
    const out = await reviewDrafts([item('a')], { call, log: () => undefined });
    expect(call).toHaveBeenCalledTimes(2);
    expect(out[0]).toMatchObject({ rewritten: false, text: 'text a' });
  });
});

describe('corpus and eval summary', () => {
  it('parses entry lines and ignores prose', () => {
    const out = parseCorpus('# t\n\n- EX-S01 | a/b.json | hello | pipe\nnot an entry');
    expect(out).toEqual([{ id: 'EX-S01', source: 'a/b.json', text: 'hello | pipe' }]);
  });

  it('ships at least 40 exemplars and 20 counter-examples', () => {
    const { exemplars, counterExamples } = loadCorpus();
    expect(exemplars.length).toBeGreaterThanOrEqual(40);
    expect(counterExamples.length).toBeGreaterThanOrEqual(20);
    expect(new Set([...exemplars, ...counterExamples].map((e) => e.id)).size)
      .toBe(exemplars.length + counterExamples.length);
  });

  it('computes set means and the gap', () => {
    const rows = [
      { id: 'a', status: 'scored', scores: { love: 4, insight: 4 } },
      { id: 'b', status: 'scored', scores: { love: 2, insight: 2 } },
      { id: 'c', status: 'not_scored' },
    ];
    const labels = new Map([['a', 'exemplar'], ['b', 'counter'], ['c', 'counter']]);
    expect(summarize(rows, labels)).toMatchObject({ exemplarMean: 4, counterMean: 2, gap: 2, notScored: 1 });
  });
});

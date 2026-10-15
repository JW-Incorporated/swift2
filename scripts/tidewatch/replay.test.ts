import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  commitShape, pickMerch, pickTheories, shapeLead, shapeNews, syntheticItems,
} from './export-replay.mjs';
import {
  CLASS_MAP, HARD_CAP, deriveClass, labelAll, main, renderBatch, validateBatch, pickSpotCheck,
} from './label-replay.mjs';

const config = JSON.parse(readFileSync('config/tidewatch.json', 'utf8'));

const newsRow = {
  id: 'n1', canonical_title: 'Album announced', summary: 'Public summary', category: 'music', importance: 9,
  source_count: 2, verification_status: 'official', first_seen_at: '2026-10-01T00:00:00Z',
  sources: [{ outlet: 'Outlet A', tier: 'official', url: 'https://www.example.com/a' }],
};
const leadRow = (platform: string) => ({
  id: 'l1', platform, community: 'r/swifties', kind: 'hot_thread', thread_id: 't3_abc', url: 'https://reddit.com/r/x/comments/abc/slug_here/',
  title: 'VERBATIM MEMBER TITLE', context: 'OUR WORDS CONTEXT', locator: 'GROUP: VERBATIM FB TEXT',
  relevance: 0.7, status: 'new', created_at: '2026-10-02T00:00:00Z', draft: 'DRAFT TEXT',
});

describe('export shaping and privacy', () => {
  it('commits no member text for Reddit or Facebook leads', () => {
    for (const platform of ['reddit', 'facebook']) {
      const json = JSON.stringify(commitShape(shapeLead(leadRow(platform))));
      for (const secret of ['VERBATIM', 'OUR WORDS', 'DRAFT TEXT', 'GROUP:']) expect(json).not.toContain(secret);
    }
  });

  it('Facebook leads keep no url, thread id, community or title even in the raw shape', () => {
    const raw = shapeLead(leadRow('facebook'));
    expect(raw.text.title).toBe('');
    expect(raw.meta).toMatchObject({ url: null, threadId: null, community: null });
  });

  it('Reddit leads commit the url and id but not the title', () => {
    const shaped = commitShape(shapeLead(leadRow('reddit')));
    expect(shaped.meta.url).toBe('/r/x/comments/abc/');
    expect(shaped).not.toHaveProperty('title');
  });

  it('strips the Reddit title slug from committed permalinks', () => {
    const row = { ...leadRow('reddit'), url: 'https://www.reddit.com/r/swifties/comments/abc123/my_private_member_title_slug/?utm=x' };
    const shaped = commitShape(shapeLead(row));
    expect(shaped.meta.url).toBe('/r/swifties/comments/abc123/');
    expect(JSON.stringify(shaped)).not.toContain('member_title_slug');
    expect(commitShape(shapeLead({ ...row, url: 'https://example.com/other' })).meta.url).toBeNull();
  });

  it('news keeps its public title and only outlet and tier per source', () => {
    const shaped = commitShape(shapeNews(newsRow));
    expect(shaped.title).toBe('Album announced');
    expect(shaped.meta.outlets).toEqual([{ outlet: 'Outlet A', tier: 'official' }]);
    expect(JSON.stringify(shaped)).not.toContain('example.com/a');
  });

  it('picks merch deterministically and tops up when fan-made is short', () => {
    const official = Array.from({ length: 50 }, (_, n) => ({ sourceId: `o${n}`, item: `O${n}`, url: `https://s/o${n}` }));
    const fan = Array.from({ length: 5 }, (_, n) => ({ sourceId: `f${n}`, item: `F${n}`, url: `https://s/f${n}` }));
    const a = pickMerch(official, fan, 20);
    expect(a).toHaveLength(20);
    expect(a.filter((m) => m.meta.group === 'fan_made')).toHaveLength(5);
    expect(pickMerch(official, fan, 20).map((m) => m.id)).toEqual(a.map((m) => m.id));
  });

  it('picks theory bundles across eras', () => {
    const eras = [{ eraSlug: 'a', theories: [{ slug: 'x', title: 'X', claim: 'c' }, { slug: 'y' }] }, { eraSlug: 'b', theories: [{ slug: 'z' }] }];
    expect(pickTheories(eras, 2)).toHaveLength(2);
  });

  it('synthetic items are flagged and sized to the floors', () => {
    const both = syntheticItems(true, true);
    expect(both.every((i) => i.synthetic === true && commitShape(i).synthetic === true)).toBe(true);
    expect(both.filter((i) => i.expectedClass === 'critical_breaking').length).toBeGreaterThanOrEqual(15);
    expect(both.filter((i) => i.expectedClass === 'critical_personal').length).toBeGreaterThanOrEqual(5);
    expect(syntheticItems(false, false)).toEqual([]);
  });
});

const items = (n: number) => Array.from({ length: n }, (_, k) => shapeNews({ ...newsRow, id: `n${k}`, canonical_title: `T${k}` }));
const goodRow = (id: string, over: Record<string, unknown> = {}) => ({
  id, c: 'general_news', o: false, s: 'stated_fact', u: 2, p: false, x: false, f: false, m: 'not_product',
  b: false, t: false, d: 2, i: false, ...over,
});
const okCall = () => vi.fn(async (input: { user: string }) => {
  const count = Number(/Label these (\d+) items/.exec(input.user)?.[1]);
  return { status: 'ok', data: { labels: Array.from({ length: count }, (_, k) => goodRow(`i${k + 1}`)) } };
});
const fresh = () => ({ calls: 0, labels: {} as Record<string, unknown>, synthetic: [] });

describe('batch builder', () => {
  it('numbers items, wraps them as data and strips urls and markup', () => {
    const rendered = renderBatch([shapeNews({ ...newsRow, summary: 'see https://evil.example/x **bold** <b>tag</b>' })]);
    expect(rendered).toContain('<item id="i1"');
    expect(rendered).not.toContain('https://evil');
    expect(rendered).not.toContain('**');
    expect(rendered).not.toContain('<b>');
  });
});

describe('output validator', () => {
  const batch = items(2);
  it('accepts a complete valid response and derives tidewatch classes', () => {
    const res = validateBatch({ labels: [goodRow('i1', { c: 'critical_work_news' }), goodRow('i2')] }, batch);
    expect(res.ok).toBe(true);
    expect(res.labels[batch[0].id].class).toBe('critical_breaking');
    expect(res.labels[batch[0].id].answers.q_class).toBe('critical_work_news');
  });
  it('lets speculation win as privacy_redline', () => {
    expect(deriveClass({ q_class: 'personal_life_milestone', q_speculation: true })).toBe('privacy_redline');
  });
  it.each([
    ['missing item', { labels: [goodRow('i1')] }],
    ['duplicate id', { labels: [goodRow('i1'), goodRow('i1')] }],
    ['unknown id', { labels: [goodRow('i1'), goodRow('i9')] }],
    ['bad enum', { labels: [goodRow('i1'), goodRow('i2', { c: 'nope' })] }],
    ['bad score', { labels: [goodRow('i1'), goodRow('i2', { u: 9 })] }],
    ['bad bool', { labels: [goodRow('i1'), goodRow('i2', { o: 'yes' })] }],
    ['no labels', {}],
  ])('rejects %s', (_name, data) => {
    expect(validateBatch(data, batch).ok).toBe(false);
  });
  it('every mapped class exists in the P1-03 config', () => {
    for (const cls of Object.values(CLASS_MAP)) expect(config.classes).toHaveProperty(cls);
  });
});

describe('label runner: retry, split, resume and call cap', () => {
  it('labels all items in batches of 25 on the lowest priority', async () => {
    const call = okCall();
    const p = fresh();
    const r = await labelAll({ items: items(60), progress: p, call, save: async () => {} });
    expect(r).toMatchObject({ calls: 3, remaining: 0, stopped: null });
    expect(call.mock.calls[0][0]).toMatchObject({ priority: 'P3', model: 'claude-sonnet-5-5' });
  });

  it('retries a failed batch once, then splits it in half', async () => {
    let n = 0;
    const base = okCall();
    const call = vi.fn(async (input: { user: string }) => (n++ < 2 ? { status: 'invalid', reason: 'x' } : base(input)));
    const r = await labelAll({ items: items(10), progress: fresh(), call, save: async () => {} });
    expect(r.remaining).toBe(0);
    expect(r.calls).toBe(4);
  });

  it('stops on a limit without burning retries and resumes from progress', async () => {
    const saved: string[] = [];
    const p = fresh();
    const limited = vi.fn(async () => ({ status: 'unavailable', reason: 'limit' }));
    const first = await labelAll({ items: items(30), progress: p, call: limited, save: async (x) => { saved.push(JSON.stringify(x)); } });
    expect(first.stopped).toBe('limit');
    expect(limited).toHaveBeenCalledTimes(1);
    const resumed = JSON.parse(saved.at(-1) as string);
    const r = await labelAll({ items: items(30), progress: resumed, call: okCall(), save: async () => {} });
    expect(r.remaining).toBe(0);
    expect(r.calls).toBe(3);
  });

  it('skips items already labelled in progress', async () => {
    const call = okCall();
    const all = items(30);
    const p = fresh();
    p.labels[all[0].id] = { class: 'noise' };
    await labelAll({ items: all, progress: p, call, save: async () => {} });
    expect(call.mock.calls[0][0].user).toContain('Label these 25 items');
  });

  it('never exceeds the hard cap, even when asked for more', async () => {
    const call = vi.fn(async () => ({ status: 'invalid', reason: 'x' }));
    const r = await labelAll({ items: items(500), progress: fresh(), call, save: async () => {}, maxCalls: 999 });
    expect(call.mock.calls.length).toBeLessThanOrEqual(HARD_CAP);
    expect(r.calls).toBe(HARD_CAP);
    expect(r.stopped).toBe('call cap reached');
  });

  it('counts calls from earlier runs against the cap', async () => {
    const p = { ...fresh(), calls: HARD_CAP };
    const call = okCall();
    const r = await labelAll({ items: items(5), progress: p, call, save: async () => {} });
    expect(call).not.toHaveBeenCalled();
    expect(r.remaining).toBe(5);
  });
});

describe('end to end with a fake wrapper', () => {
  it('writes labels only, adds flagged synthetics when short, and a spot-check', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'replay-'));
    const rawPath = join(dir, 'raw.json');
    const progressPath = join(dir, 'progress.json');
    const outDir = join(dir, 'out');
    const pool = [
      ...items(10), shapeLead(leadRow('reddit')), shapeLead(leadRow('facebook')),
    ];
    writeFileSync(rawPath, JSON.stringify({ items: pool }));
    const call = vi.fn(async (input: { user: string }) => {
      const count = Number(/Label these (\d+) items/.exec(input.user)?.[1]);
      const critical = input.user.includes('Album announced') && input.user.includes('midnight');
      return { status: 'ok', data: { labels: Array.from({ length: count }, (_, k) => goodRow(`i${k + 1}`, critical ? { c: 'critical_work_news' } : {})) } };
    });
    const lines: string[] = [];
    const code = await main(['--raw', rawPath, '--progress', progressPath, '--out', outDir], { call, log: (l: string) => lines.push(l) });
    expect(code).toBe(2);
    const replay = JSON.parse(readFileSync(join(outDir, 'replay.json'), 'utf8'));
    expect(replay.counts.synthetic).toBeGreaterThanOrEqual(20);
    expect(replay.items.filter((i: { synthetic: boolean }) => i.synthetic).length).toBe(replay.counts.synthetic);
    const text = readFileSync(join(outDir, 'replay.json'), 'utf8');
    for (const secret of ['VERBATIM', 'OUR WORDS', 'DRAFT TEXT']) expect(text).not.toContain(secret);
    expect(existsSync(join(outDir, 'spot-check.json'))).toBe(true);
    expect(lines.at(-1)).toMatch(/^tidewatch label: pool=\d+ belowFloor=(true|false) labelled=\d+ remaining=0 calls=\d+\/40 critical=\d+ personal=\d+/);
  });

  it('spot-check prefers critical and personal entries and excludes synthetics', () => {
    const e = (id: string, cls: string, extra = {}) => ({ id, class: cls, synthetic: false, answers: { q_urgency: 1, q_personal: false, q_settled: 'stated_fact' }, ...extra });
    const picked = pickSpotCheck([e('a', 'noise'), e('b', 'critical_breaking'), e('c', 'critical_breaking', { synthetic: true })], 30);
    expect(picked.map((x: { id: string }) => x.id)).toEqual(['b']);
  });
});

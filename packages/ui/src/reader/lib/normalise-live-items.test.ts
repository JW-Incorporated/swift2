import { afterEach, describe, expect, it, vi } from 'vitest';
import { outletFor } from '@swift2/experience';
import { normaliseCurrentItems, objectRows } from './normalise-live-items';
import { LIVE_FETCH_TIMEOUT_MS, fetchLiveData } from './use-live-data';

const row = (over: Record<string, unknown> = {}) => ({
  id: 'a',
  observedOn: '2026-11-10',
  eraId: 'tloas',
  category: 'music',
  tags: ['Music'],
  headline: 'A headline',
  summary: 'A summary.',
  detail: 'Detail.',
  status: 'reported',
  confidence: 'reported',
  sourceTier: 'established',
  sources: [{ name: 'People', url: 'https://people.com/x', tier: 'established' }],
  symbols: [],
  entities: [],
  heat: 2,
  lastCheckedOn: '2026-11-10',
  expiresAt: '2026-12-10T00:00:00Z',
  updatedAt: '2026-11-10T00:00:00Z',
  redlineOk: true,
  ...over,
});

const without = (key: string) => {
  const copy: Record<string, unknown> = row({ id: `no-${key}` });
  delete copy[key];
  return copy;
};

describe('normaliseCurrentItems', () => {
  it('passes a well-formed row through unchanged in substance', () => {
    const [item] = normaliseCurrentItems([row()]);
    expect(item).toMatchObject(row());
  });

  it('defaults a missing sources field to [] so the outlet lookup cannot crash', () => {
    const [item] = normaliseCurrentItems([without('sources')]);
    expect(item!.sources).toEqual([]);
    expect(outletFor(item!)).toBeUndefined();
  });

  it('keeps the good rows when one row is malformed', () => {
    const items = normaliseCurrentItems([row({ id: 'first' }), without('sources'), null, row({ id: 'last' })]);
    expect(items.map((i) => i.id)).toEqual(['first', 'no-sources', 'last']);
  });

  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['a number', 7],
    ['an array', []],
    ['no id', without('id')],
    ['a numeric id', row({ id: 5 })],
    ['a blank headline', row({ headline: '  ' })],
    ['a non-string headline', row({ headline: { text: 'x' } })],
    ['no date', without('observedOn')],
  ])('drops a row that is %s', (_label, bad) => {
    expect(normaliseCurrentItems([bad])).toEqual([]);
  });

  it.each([
    ['a status this build does not know', row({ id: 'new-status', status: 'developing' })],
    ['no status', without('status')],
    ['a non-string status', row({ id: 'odd-status', status: 3 })],
  ])('keeps a row with %s and labels it reported', (_label, odd) => {
    const items = normaliseCurrentItems([odd]);
    expect(items).toHaveLength(1);
    expect(items[0]!.status).toBe('reported');
  });

  it.each(['rumor', 'reported', 'confirmed', 'debunked', 'faded'])('leaves the known status %s alone', (status) => {
    expect(normaliseCurrentItems([row({ status })])[0]!.status).toBe(status);
  });

  it('coerces wrong-typed fields the UI dereferences', () => {
    const [item] = normaliseCurrentItems([
      row({
        sources: 'people.com',
        tags: 'Music',
        symbols: null,
        entities: [1, 'Travis Kelce', null],
        summary: 12,
        detail: null,
        heat: 'hot',
        redlineOk: 'yes',
        imageUrl: 404,
        embed: 'dQw4w9WgXcQ',
        facts: 'none',
        updatedAt: 1731196800,
      }),
    ]);
    expect(item).toMatchObject({
      sources: [],
      tags: [],
      symbols: [],
      entities: ['Travis Kelce'],
      summary: '',
      detail: '',
      heat: 0,
      redlineOk: false,
      updatedAt: '',
    });
    expect(item!.imageUrl).toBeUndefined();
    expect(item!.embed).toBeUndefined();
    expect(item!.facts).toBeUndefined();
  });

  it('drops source entries that are not objects with a url', () => {
    const [item] = normaliseCurrentItems([
      row({ sources: [null, 'x', { name: 'No url' }, { url: 'https://bbc.com/a' }] }),
    ]);
    expect(item!.sources).toEqual([{ name: '', url: 'https://bbc.com/a' }]);
  });

  it.each([undefined, null, 'items', 3, { 0: row() }])('returns [] for a non-array payload (%s)', (raw) => {
    expect(normaliseCurrentItems(raw)).toEqual([]);
  });

  it('objectRows keeps only object rows with an id and defaults the named arrays', () => {
    expect(objectRows([null, 1, 'a', [], { name: 'no id' }, { id: 'x' }])).toEqual([{ id: 'x' }]);
    expect(objectRows('nope')).toEqual([]);
    expect(
      objectRows<{ id: string; symbols: string[]; sampleUrls: string[] }>(
        [{ id: 's', symbols: 'snake', sampleUrls: ['https://a.example/x'] }],
        ['symbols', 'sampleUrls'],
      ),
    ).toEqual([{ id: 's', symbols: [], sampleUrls: ['https://a.example/x'] }]);
  });
});

describe('fetchLiveData resilience', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const respond = (body: unknown) =>
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => body }));

  it('serves the good rows of a payload with one row missing sources', async () => {
    respond({ items: [row({ id: 'ok' }), without('sources'), null], theories: [null], signals: [null, { id: 's' }] });
    const data = await fetchLiveData('resilience-mixed');
    expect(data.items.map((i) => i.id)).toEqual(['ok', 'no-sources']);
    expect(data.theories).toEqual([]);
    expect(data.signals).toEqual([{ id: 's', symbols: [], theoryIds: [], currentItemIds: [], sampleUrls: [] }]);
  });

  it.each([null, 'oops', 42, []])('resolves to the empty payload for a non-object body (%s)', async (body) => {
    respond(body);
    expect(await fetchLiveData(`resilience-body-${String(body)}`)).toEqual({ items: [], theories: [], signals: [] });
  });

  const EMPTY = { items: [], theories: [], signals: [] };
  const stall = (_url: string, init?: { signal?: AbortSignal }) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    });

  it('bounds each attempt at 20 s', () => {
    expect(LIVE_FETCH_TIMEOUT_MS).toBe(20_000);
  });

  it('retries once after a timeout and serves the second answer', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(stall)
      .mockResolvedValue({ ok: true, json: async () => ({ items: [row({ id: 'late' })] }) });
    vi.stubGlobal('fetch', fetchMock);
    const pending = fetchLiveData('resilience-retry');
    await vi.advanceTimersByTimeAsync(LIVE_FETCH_TIMEOUT_MS - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect((await pending).items.map((i) => i.id)).toEqual(['late']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to the empty payload when the retry stalls too, and stops there', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(stall);
    vi.stubGlobal('fetch', fetchMock);
    const pending = fetchLiveData('resilience-stall');
    await vi.advanceTimersByTimeAsync(LIVE_FETCH_TIMEOUT_MS);
    await vi.advanceTimersByTimeAsync(LIVE_FETCH_TIMEOUT_MS);
    expect(await pending).toEqual(EMPTY);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries a response whose body stalls', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async (_url: string, init?: { signal?: AbortSignal }) => ({
        ok: true,
        json: () => stall('', init),
      }))
      .mockResolvedValue({ ok: true, json: async () => ({ items: [row({ id: 'second' })] }) });
    vi.stubGlobal('fetch', fetchMock);
    const pending = fetchLiveData('resilience-body-stall');
    await vi.advanceTimersByTimeAsync(LIVE_FETCH_TIMEOUT_MS);
    expect((await pending).items.map((i) => i.id)).toEqual(['second']);
  });

  it.each([
    ['a non-2xx response', () => Promise.resolve({ ok: false, json: async () => ({}) })],
    ['a network error', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['malformed JSON', () => Promise.resolve({ ok: true, json: async () => { throw new SyntaxError('bad json'); } })],
  ])('does not retry %s', async (label, respondWith) => {
    const fetchMock = vi.fn(respondWith);
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchLiveData(`resilience-no-retry-${label}`)).toEqual(EMPTY);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

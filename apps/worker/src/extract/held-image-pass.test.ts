import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { reresolveHeldImages } from './held-image-pass';
import { resetRunStats } from '../run-stats';

const BILLBOARD = 'https://www.billboard.com/music/story/';

function b64url(bytes: Buffer): string {
  return bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const legacy = `https://news.google.com/rss/articles/${b64url(
  Buffer.concat([Buffer.from([0x08, 0x13, 0x22, BILLBOARD.length]), Buffer.from(BILLBOARD), Buffer.from([0xd2, 0x01, 0x00])]),
)}`;

const longSummary =
  'Taylor Swift published an official and time-sensitive announcement for fans around the world today. The verified source provides the primary account and a usable editorial image.';
const row = (over: Record<string, unknown> = {}) => ({
  id: 'ci-1',
  observed_on: '2026-10-22',
  image_attempts: 0,
  last_image_attempt_at: null,
  headline: 'Taylor Swift announces something',
  summary: longSummary,
  detail: Array(60).fill('detail').join(' '),
  image_url: null,
  sources: [{ name: 'unknown', url: legacy, tier: 'unverified' }],
  ...over,
});

type Row = Record<string, unknown>;

function fakeDb(rows: Row[]) {
  const updates: Row[] = [];
  const guards: boolean[] = [];
  const db = {
    from: () => ({
      select: () => {
        let result = [...rows];
        const query: Record<string, unknown> = {};
        for (const m of ['eq', 'is', 'gt', 'gte']) query[m] = () => query;
        query.lt = (col: string, v: number) => {
          result = result.filter((r) => ((r[col] as number | null) ?? 0) < v);
          return query;
        };
        const orders: { col: string; asc: boolean }[] = [];
        query.order = (col: string, o: { ascending: boolean }) => {
          orders.push({ col, asc: o.ascending });
          return query;
        };
        query.limit = (n: number) => {
          result.sort((x, y) => {
            for (const { col, asc } of orders) {
              const c = String(x[col] ?? '').localeCompare(String(y[col] ?? ''));
              if (c !== 0) return asc ? c : -c;
            }
            return 0;
          });
          return Promise.resolve({ data: result.slice(0, n), error: null });
        };
        return query;
      },
      update: (patch: Row) => {
        updates.push(patch);
        let target: Row | undefined;
        let guarded = false;
        const chain: Record<string, unknown> = {};
        chain.eq = (_c: string, id: string) => {
          target = rows.find((r) => r.id === id);
          return chain;
        };
        chain.is = (col: string) => {
          guarded = col === 'retracted_at';
          return chain;
        };
        chain.then = (resolve: (v: unknown) => void) => {
          guards.push(guarded);
          if (target) Object.assign(target, patch);
          resolve({ error: null });
        };
        return chain;
      },
    }),
  } as unknown as SupabaseClient;
  return { db, updates, guards };
}

const pageWith = (img: string) =>
  new Response(`<meta property="og:image" content="${img}">`, {
    status: 200,
    headers: { 'content-type': 'text/html' },
  });

describe('reresolveHeldImages', () => {
  beforeEach(() => resetRunStats());

  it('resolves the Google News source, finds the image, and publishes the row', async () => {
    const { db, updates, guards } = fakeDb([row()]);
    const fetchImpl = vi.fn().mockResolvedValue(pageWith('https://www.billboard.com/wp-content/og.jpg'));
    const result = await reresolveHeldImages(db, fetchImpl as unknown as typeof fetch);
    expect(result).toMatchObject({ checked: 1, published: 1, errors: [] });
    expect(fetchImpl).toHaveBeenCalledWith(BILLBOARD, expect.anything());
    expect(updates[0]).toMatchObject({
      image_url: 'https://www.billboard.com/wp-content/og.jpg',
      sources: [{ name: 'unknown', url: BILLBOARD, tier: 'established' }],
    });
    expect(updates[0]).toMatchObject({ image_attempts: 1 });
    expect(updates[1]).toEqual({ redline_ok: true, quality_hold_reason: null });
    expect(guards).toEqual([true, true]);
  });

  it('keeps the row held when the publisher page has no usable image', async () => {
    const { db, updates } = fakeDb([row()]);
    const fetchImpl = vi.fn().mockResolvedValue(new Response('<p/>', { headers: { 'content-type': 'text/html' } }));
    const result = await reresolveHeldImages(db, fetchImpl as unknown as typeof fetch);
    expect(result.published).toBe(0);
    expect(updates[1]).toMatchObject({ redline_ok: false, quality_hold_reason: 'missing_image' });
  });

  it('only bumps the attempt counter when nothing resolves', async () => {
    const { db, updates } = fakeDb([
      row({ sources: [{ name: 'unknown', url: 'https://news.google.com/rss/articles/AU_yqLopaque', tier: 'unverified' }] }),
    ]);
    const fetchImpl = vi.fn().mockRejectedValue(new Error('down'));
    const result = await reresolveHeldImages(db, fetchImpl as unknown as typeof fetch);
    expect(result).toMatchObject({ checked: 1, published: 0 });
    expect(updates[0]).toMatchObject({ image_attempts: 1 });
    expect(updates[1]).toMatchObject({ quality_hold_reason: 'missing_image' });
  });

  it('rotates: 15 never-resolvable rows do not starve a resolvable one, and exhausted rows are skipped', async () => {
    const bad = Array.from({ length: 15 }, (_, n) =>
      row({
        id: 'bad-' + n,
        observed_on: '2026-10-22',
        sources: [{ name: 'B', url: 'https://www.billboard.com/bad/' + n, tier: 'established' }],
      }),
    );
    const good = row({
      id: 'good',
      observed_on: '2026-10-20',
      sources: [{ name: 'B', url: 'https://www.billboard.com/good/', tier: 'established' }],
    });
    const exhausted = row({ id: 'spent', image_attempts: 5, observed_on: '2026-10-22' });
    const rows: Row[] = [...bad, good, exhausted];
    const { db } = fakeDb(rows);
    const fetchImpl = vi.fn(async (url: string | URL | Request) =>
      String(url).includes('/good/')
        ? pageWith('https://www.billboard.com/wp-content/g.jpg')
        : new Response('<p/>', { headers: { 'content-type': 'text/html' } }),
    ) as unknown as typeof fetch;
    const first = await reresolveHeldImages(db, fetchImpl, new Date('2026-10-22T10:00:00Z'));
    expect(first.published).toBe(0);
    const second = await reresolveHeldImages(db, fetchImpl, new Date('2026-10-22T11:00:00Z'));
    expect(second.published).toBe(1);
    expect(rows.find((r) => r.id === 'good')!.quality_hold_reason).toBeNull();
    expect(rows.find((r) => r.id === 'spent')!.image_attempts).toBe(5);
  });
});

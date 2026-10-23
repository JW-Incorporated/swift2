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
  headline: 'Taylor Swift announces something',
  summary: longSummary,
  detail: Array(60).fill('detail').join(' '),
  image_url: null,
  sources: [{ name: 'unknown', url: legacy, tier: 'unverified' }],
  ...over,
});

function fakeDb(rows: unknown[]) {
  const updates: Record<string, unknown>[] = [];
  const query: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'is', 'gt', 'gte', 'order']) query[m] = () => query;
  query.limit = () => Promise.resolve({ data: rows, error: null });
  const db = {
    from: () => ({
      select: () => query,
      update: (patch: Record<string, unknown>) => {
        updates.push(patch);
        const chain: Record<string, unknown> = {};
        chain.eq = () => chain;
        chain.is = () => Promise.resolve({ error: null });
        chain.then = (resolve: (v: unknown) => void) => resolve({ error: null });
        return chain;
      },
    }),
  } as unknown as SupabaseClient;
  return { db, updates };
}

const pageWith = (img: string) =>
  new Response(`<meta property="og:image" content="${img}">`, {
    status: 200,
    headers: { 'content-type': 'text/html' },
  });

describe('reresolveHeldImages', () => {
  beforeEach(() => resetRunStats());

  it('resolves the Google News source, finds the image, and publishes the row', async () => {
    const { db, updates } = fakeDb([row()]);
    const fetchImpl = vi.fn().mockResolvedValue(pageWith('https://www.billboard.com/wp-content/og.jpg'));
    const result = await reresolveHeldImages(db, fetchImpl as unknown as typeof fetch);
    expect(result).toMatchObject({ checked: 1, published: 1, errors: [] });
    expect(fetchImpl).toHaveBeenCalledWith(BILLBOARD, expect.anything());
    expect(updates[0]).toMatchObject({
      image_url: 'https://www.billboard.com/wp-content/og.jpg',
      sources: [{ name: 'unknown', url: BILLBOARD, tier: 'established' }],
    });
    expect(updates[1]).toEqual({ redline_ok: true, quality_hold_reason: null });
  });

  it('keeps the row held when the publisher page has no usable image', async () => {
    const { db, updates } = fakeDb([row()]);
    const fetchImpl = vi.fn().mockResolvedValue(new Response('<p/>', { headers: { 'content-type': 'text/html' } }));
    const result = await reresolveHeldImages(db, fetchImpl as unknown as typeof fetch);
    expect(result.published).toBe(0);
    expect(updates[1]).toMatchObject({ redline_ok: false, quality_hold_reason: 'missing_image' });
  });

  it('does nothing when no source resolves and no image is found', async () => {
    const { db, updates } = fakeDb([
      row({ sources: [{ name: 'unknown', url: 'https://news.google.com/rss/articles/AU_yqLopaque', tier: 'unverified' }] }),
    ]);
    const fetchImpl = vi.fn().mockRejectedValue(new Error('down'));
    const result = await reresolveHeldImages(db, fetchImpl as unknown as typeof fetch);
    expect(result).toMatchObject({ checked: 1, published: 0 });
    expect(updates).toHaveLength(0);
  });
});

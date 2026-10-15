import { describe, expect, it, vi } from 'vitest';
import { buildMatcherInput, needsProductRefresh } from './build-matcher-input.mjs';
import { findOpenMatcherPr, openMatcherPr } from './matcher-open-pr-guard.mjs';
import {
  prepareMomentProducts,
  productFromCandidate,
  selectAlternatives,
  writeProductsToSource,
} from './write-moment-products.mjs';

const now = new Date('2026-10-15T12:00:00.000Z');
const photo = (url: string) => ({ photos: [{ url }] });
const item = (title: string, day: number, products?: object[]) => ({
  year: 2026, month: 10, day, category: 'fashion', title,
  moment: { ...photo(`https://images.example/${title}.jpg`), ...(products ? { products } : {}) },
});

describe('P1-19 matcher input', () => {
  it('selects missing or stale fashion moments, newest first, and caps the run at three', () => {
    const fresh = { verifiedAt: '2026-10-14T12:00:00.000Z' };
    const corpora = [{ sourceFile: 'supabase/seed/content/test.mjs', eraSlug: 'lover', items: [
      item('old', 1), item('newest', 14), item('second', 13), item('third', 12), item('fresh', 15, [fresh]),
      { ...item('music', 15), category: 'music' },
    ] }];
    const input = buildMatcherInput({ corpora, tidewatchClass: { enabled: false, shadow: true }, now });
    expect(input.moments.map((row) => row.moment.title)).toEqual(['newest', 'second', 'third']);
    expect(input.sources.tidewatch).toEqual({ enabled: false, used: 0 });
    expect(input.paidSearch.cap).toBe(5);
  });

  it('treats missing and older-than-seven-day verification as stale', () => {
    expect(needsProductRefresh(item('none', 1), now)).toBe(true);
    expect(needsProductRefresh(item('stale', 1, [{ verifiedAt: '2026-10-01T00:00:00Z' }]), now)).toBe(true);
    expect(needsProductRefresh(item('fresh', 1, [{ verifiedAt: '2026-10-15T00:00:00Z' }]), now)).toBe(false);
  });
});

describe('P1-19 writer', () => {
  const candidate = (id: string, score: number, price: string) => ({
    id, score, source: 'paid-search', title: `${id} dress`, price,
    productUrl: `https://shop.example/${id}`, imageUrl: `https://images.example/${id}.jpg`,
  });

  it('maps candidate score to matchScore/matchTier without affiliate data', () => {
    expect(productFromCandidate(candidate('one', 82, '$75'), { score: 82, kind: 'dress' }, now.toISOString())).toEqual({
      brand: 'shop.example', item: 'one dress', retailer: 'shop.example',
      url: 'https://shop.example/one', matchTier: 'close', matchScore: 82,
      kind: 'dress', imageUrl: 'https://images.example/one.jpg', price: '$75', verifiedAt: now.toISOString(),
    });
  });

  it('keeps the best match and at most two alternatives in distinct price bands', () => {
    const selected = selectAlternatives('look', [
      candidate('best', 95, '$250'), candidate('mid', 80, '$100'),
      candidate('same-band', 79, '$90'), candidate('low', 70, '$30'),
    ]);
    expect(selected.map((row) => row.id)).toEqual(['best', 'mid', 'low']);
  });

  it.each([
    ['E1', async () => ({ verdict: 'unverified' }), async () => ({ verdict: 'ok', status: 200 })],
    ['E2', async () => ({ verdict: 'ok' }), async () => { throw new Error('timeout'); }],
  ])('holds the whole moment on a transient %s failure', async (_gate, linkCheck, imageCheck) => {
    const auditImpl = vi.fn(async ({ queue }) => ({ judgments: queue.queue.map((pair: { productId: string }) => ({
      ...pair, score: 80, tier: 'close', kind: 'dress', reasons: ['same silhouette'],
    })) }));
    const result = await prepareMomentProducts({
      momentId: 'look', momentImageUrl: 'https://images.example/look.jpg', products: [candidate('one', 80, '$75')],
    }, { auditImpl, linkCheck, imageCheck, now });
    expect(result.status).toBe('hold');
    expect(result.products).toEqual([]);
  });

  it('replaces the target moment products array only', () => {
    const source = `export default { eraSlug: 'lover', items: [{ title: 'Look', category: 'fashion', moment: { photos: [], products: [] } }] };\n`;
    const written = writeProductsToSource(source, 'vault-lover-look', [{ item: 'Dress', url: 'https://shop.example/dress' }]);
    expect(written).toContain('"item": "Dress"');
    expect(written).toContain('products: [');
  });
});

describe('P1-19 open-PR guard', () => {
  const prs = [{ number: 42, headRefName: 'merch-matcher/123', createdAt: '2026-10-14T00:00:00Z' }];

  it('finds a recent matcher PR and ignores other prefixes', () => {
    expect(openMatcherPr(prs, now)?.number).toBe(42);
    expect(openMatcherPr([{ ...prs[0], headRefName: 'merch-official-sync/1' }], now)).toBeNull();
  });

  it('queries open PRs through an injectable fake', async () => {
    const run = vi.fn(async () => ({ stdout: JSON.stringify(prs) }));
    expect((await findOpenMatcherPr({ run, now }))?.number).toBe(42);
    expect(run).toHaveBeenCalledWith('gh', expect.arrayContaining(['--state', 'open']));
  });
});

import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { check } from './fashion-products.mjs';

const fashion = (over: Record<string, unknown> = {}) => ({
  type: 'moment',
  file: 'supabase/seed/content/the-life-of-a-showgirl.mjs',
  era: 'the-life-of-a-showgirl',
  key: 'k',
  title: 'A look',
  category: 'fashion',
  texts: { snippet: '', context: '' },
  images: [],
  sources: [],
  raw: {},
  ...over,
});

describe('fashion-products check', () => {
  it('flags the canonical case: named brand + buyable garment, no products (the engagement look)', async () => {
    const look = fashion({
      title: 'The engagement look: a Polo Ralph Lauren dress in the garden',
      texts: { snippet: 'A striped silk-blend Ralph Lauren dress with Louis Vuitton sandals.' },
    });
    const f = await check([look]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.fashion-products');
  });

  it('does NOT flag bespoke jewelry (the engagement ring) — no garment noun', async () => {
    const ring = fashion({
      title: 'The ring: an old mine diamond from a goldsmith Taylor already admired',
      texts: { context: 'An old mine brilliant cut set in a hand-engraved yellow-gold band by Artifex.' },
    });
    expect(await check([ring])).toEqual([]);
  });

  it('does NOT flag couture / custom / atelier one-offs — no product page exists', async () => {
    const couture = fashion({ title: 'A gown', texts: { context: 'A custom off-white Schiaparelli Haute Couture gown.' } });
    const custom = fashion({ key: 'k2', texts: { context: 'A custom Etro gown for the medley.' } });
    const atelier = fashion({ key: 'k3', texts: { context: 'An 800-hour Atelier Versace gown.' } });
    expect(await check([couture, custom, atelier])).toEqual([]);
  });

  it('does NOT flag garments with no recognizable brand', async () => {
    const generic = fashion({ texts: { context: 'A flowing red dress from an unknown label.' } });
    expect(await check([generic])).toEqual([]);
  });

  it('leaves the queue once products exist (Stylist handoff)', async () => {
    const shopped = fashion({
      texts: { snippet: 'A Polo Ralph Lauren dress.' },
      raw: { moment: { products: [{ brand: 'Polo Ralph Lauren', item: 'Striped dress', retailer: 'ralphlauren', url: 'https://x', inStock: true }] } },
    });
    expect(await check([shopped])).toEqual([]);
  });

  // Superseded 2026-07-20. This used to assert `ignores non-fashion moments
  // entirely`, which was the bug: category says nothing about whether a moment
  // describes buyable clothes, and the gate hid 42% of eligible moments. The
  // real reader-facing case was "A pink mini dress for a Saturday-night dinner
  // date" — category 'sighting', naming a Balmain minidress and Louboutin
  // sandals with prices, unreachable by the Stylist forever.
  it('flags a buyable garment whatever the moment is categorised as', async () => {
    const sighting = fashion({
      category: 'sighting',
      texts: { context: 'Stepped out in a Balmain minidress with Louboutin sandals.' },
    });
    const found = await check([sighting]);
    expect(found).toHaveLength(1);
    // Whichever brand it names first — BRANDS is scanned in list order, so
    // this is Louboutin, not the Balmain that appears first in the sentence.
    expect(found[0].evidence).toMatch(/Balmain|Louboutin/);
    expect(found[0].evidence).toContain('sighting');
  });

  it('still ranks a fashion-category moment above the others', async () => {
    const look = { texts: { context: 'A Balmain minidress with Louboutin sandals.' } };
    const inFashion = fashion({ category: 'fashion', ...look });
    const elsewhere = fashion({ category: 'sighting', ...look });
    const [a] = await check([inFashion]);
    const [b] = await check([elsewhere]);
    expect(a.confidence).toBeGreaterThan(b.confidence);
  });

  // The precision tests above (named brand, buyable garment, not one-off) are
  // what keep this from over-flagging now that category no longer gates — so
  // a non-fashion moment that only gestures at clothes must still be ignored.
  it('ignores a passing mention with no named brand, whatever the category', async () => {
    const news = fashion({
      category: 'relationship',
      texts: { context: 'She wore something red to the party.' },
    });
    expect(await check([news])).toEqual([]);
  });
});

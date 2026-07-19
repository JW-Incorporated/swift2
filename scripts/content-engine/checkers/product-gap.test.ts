import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs checker, no types
import { brandedGarmentMentions, check } from './product-gap.mjs';

const moment = (over: Record<string, unknown> = {}) => ({
  type: 'moment',
  file: 'supabase/seed/content/tortured-poets.mjs',
  era: 'tortured-poets',
  key: 'k',
  title: 'Engagement photos: a Polo Ralph Lauren dress in the garden',
  category: 'fashion',
  texts: {
    snippet:
      'A striped silk-blend Ralph Lauren dress with a creamy linen skirt, Louis Vuitton Isola sandals, and a diamond-lined Cartier watch.',
    context: '',
  },
  images: [],
  sources: [],
  raw: { moment: {} },
  ...over,
});

describe('brandedGarmentMentions', () => {
  it('finds Brand + garment ("a Schiaparelli gown")', () => {
    expect(brandedGarmentMentions('She wore a custom Schiaparelli gown to the ceremony.')).toEqual([
      'Schiaparelli gown',
    ]);
  });

  it('finds multi-word brands with descriptor words between brand and garment', () => {
    const out = brandedGarmentMentions(
      "Louis Vuitton's caramel-brown Isola sandals and a Polo Ralph Lauren silk-blend dress.",
    );
    // The nearest capitalized run to the garment wins — here that's the
    // product line ("Isola"), which is still a correct branded-garment hit.
    expect(out).toContain('Isola sandals');
    expect(out.some((m: string) => m.includes('Ralph Lauren') && m.endsWith('dress'))).toBe(true);
  });

  it('does not treat sentence-lead articles or Taylor as brands', () => {
    expect(brandedGarmentMentions('The dress was stunning. Her boots were red.')).toEqual([]);
    expect(
      brandedGarmentMentions("Taylor's dress stole the show. Taylor Swift wore a hat."),
    ).toEqual([]);
  });

  it('finds nothing in generic, brand-free fashion prose', () => {
    expect(
      brandedGarmentMentions(
        'A bold red lip, vintage silhouettes, and well-worn cowboy boots defined the era.',
      ),
    ).toEqual([]);
  });

  it('handles empty/absent text', () => {
    expect(brandedGarmentMentions('')).toEqual([]);
    expect(brandedGarmentMentions(undefined)).toEqual([]);
  });

  // Regression (review 2026-07-19): the capitalized run must not absorb the
  // PREVIOUS sentence's trailing proper noun across a sentence boundary —
  // this exact bug made 'BRIT Awards. dress' / 'Tour. dress' read as brands
  // and flagged ~2/3 of the fashion corpus.
  it('does not glue a prior sentence-ending proper noun onto the next sentence garment', () => {
    expect(brandedGarmentMentions('It was a big night for Swift. The dress sold out.')).toEqual([]);
    expect(brandedGarmentMentions('She closed the Eras Tour. The dress came later.')).toEqual([]);
    expect(
      brandedGarmentMentions(
        'She wore it to the Elle Style Awards and BRIT Awards.\n\nThe dress was only half the story.',
      ),
    ).toEqual([]);
    expect(
      brandedGarmentMentions('She arrived with Blake Lively. Her boots were vintage.'),
    ).toEqual([]);
  });

  it('still finds a real brand inside a later sentence', () => {
    expect(
      brandedGarmentMentions('The night was hers. She wore a Schiaparelli gown with gloves.'),
    ).toEqual(['Schiaparelli gown']);
  });
});

describe('product-gap check', () => {
  it('flags a fashion moment that names branded garments but has no products', async () => {
    const f = await check([moment()]);
    expect(f).toHaveLength(1);
    expect(f[0].checker).toBe('content.product-gap');
    expect(f[0].evidence).toContain('Ralph Lauren');
  });

  it('does not flag once the moment carries products', async () => {
    const withProducts = moment({
      raw: {
        moment: {
          products: [
            {
              brand: 'Polo Ralph Lauren',
              item: 'Striped Silk-Blend Day Dress',
              retailer: 'ralphlauren.com',
              url: 'https://www.ralphlauren.com/some-dress',
            },
          ],
        },
      },
    });
    expect(await check([withProducts])).toEqual([]);
  });

  it('ignores non-fashion moments and non-moment items', async () => {
    expect(await check([moment({ category: 'music' })])).toEqual([]);
    expect(await check([{ ...moment(), type: 'track' }])).toEqual([]);
  });

  it('scans the title too — a branded garment named only in the title still flags', async () => {
    const titleOnly = moment({
      title: 'The Schiaparelli gown that announced TTPD',
      texts: {
        title: 'The Schiaparelli gown that announced TTPD',
        snippet: 'She stunned on the red carpet.',
        context: '',
      },
    });
    const f = await check([titleOnly]);
    expect(f).toHaveLength(1);
  });

  it('still flags a moment whose only product row is malformed (it would not ship)', async () => {
    // "covered" means productsFrom() keeps the row — a malformed row is
    // silently dropped from the build, so the page renders with NO shop
    // block and must stay in the queue.
    const broken = moment({
      raw: { moment: { products: [{ brand: 'Polo Ralph Lauren', item: 'Dress' }] } },
    });
    const f = await check([broken]);
    expect(f).toHaveLength(1);
  });

  it('ignores fashion moments whose prose names no specific branded garment', async () => {
    const generic = moment({
      title: 'The classic red lip',
      texts: {
        snippet: 'A signature look is born: red lip, vintage silhouettes, autumn tones.',
        context: '',
      },
    });
    expect(await check([generic])).toEqual([]);
  });
});

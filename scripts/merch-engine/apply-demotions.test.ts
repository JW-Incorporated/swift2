import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyDemotions,
  findMomentSpan,
  parseProductId,
  removeProductByUrl,
  removeProductForMoment,
  scanArray,
} from './apply-demotions.mjs';

const SEED_WITH_TWO_PRODUCTS = `export default {
  eraSlug: 'evermore',
  items: [
    {
      title: 'a moment',
      moment: {
        products: [
          {
            brand: 'Gucci',
            item: 'A Dress',
            retailer: 'runwaycatalog.com',
            url: 'https://www.runwaycatalog.com/products/gucci-silk-floral-print-dress',
            price: '$2,640.00',
          },
          {
            brand: 'Etro',
            item: 'A Different Dress',
            retailer: 'etro.com',
            url: 'https://www.etro.com/us-en/peau-d-ange-silk-long-dress.html',
            price: '$2,880.00',
          },
        ],
      },
    },
  ],
};
`;

// Two DIFFERENT moments that happen to list the SAME retailer url — the
// real shape flagged by the #3447 P2 round-4 review (this repo's own
// corpus already reuses a handful of listing urls across unrelated
// moments, e.g. a custom Etro gown cross-listed on two write-ups).
const SHARED_URL = 'https://www.etro.com/us-en/peau-d-ange-silk-long-dress.html';
const SEED_WITH_SHARED_URL_ACROSS_MOMENTS = `export default {
  eraSlug: 'evermore',
  items: [
    {
      title: 'the mismatch moment',
      moment: {
        products: [
          { brand: 'Etro', item: 'Wrong Match', retailer: 'etro.com', url: '${SHARED_URL}' },
        ],
      },
    },
    {
      title: 'the still-valid moment',
      moment: {
        products: [
          { brand: 'Etro', item: 'Correct Match', retailer: 'etro.com', url: '${SHARED_URL}' },
        ],
      },
    },
  ],
};
`;

describe('scanArray', () => {
  it('finds each top-level object in a products array, ignoring nested braces', () => {
    const arrayStart = SEED_WITH_TWO_PRODUCTS.indexOf('products: [') + 'products: ['.length - 1;
    const { objects } = scanArray(SEED_WITH_TWO_PRODUCTS, arrayStart);
    expect(objects).toHaveLength(2);
    expect(SEED_WITH_TWO_PRODUCTS.slice(objects[0].start, objects[0].end)).toContain('Gucci');
    expect(SEED_WITH_TWO_PRODUCTS.slice(objects[1].start, objects[1].end)).toContain('Etro');
  });
});

describe('parseProductId', () => {
  it('splits momentId:index:url, keeping the url intact despite its own colons', () => {
    expect(parseProductId('vault-evermore-a-moment:0:https://shop.example/x')).toEqual({
      momentId: 'vault-evermore-a-moment',
      index: 0,
      url: 'https://shop.example/x',
    });
  });

  it('returns null for a shape that does not match', () => {
    expect(parseProductId('not-a-valid-shape')).toBeNull();
    expect(parseProductId(null)).toBeNull();
    expect(parseProductId(undefined)).toBeNull();
  });
});

describe('findMomentSpan', () => {
  it('locates the item object whose computed vault-<era>-<slug> id matches', () => {
    const span = findMomentSpan(SEED_WITH_TWO_PRODUCTS, 'vault-evermore-a-moment');
    expect(span).not.toBeNull();
    expect(SEED_WITH_TWO_PRODUCTS.slice(span.start, span.end)).toContain('a moment');
  });

  it('returns null when no item in this file matches the momentId', () => {
    expect(findMomentSpan(SEED_WITH_TWO_PRODUCTS, 'vault-evermore-nonexistent')).toBeNull();
  });

  it('disambiguates two same-era moments sharing a url by their distinct computed ids', () => {
    const mismatchSpan = findMomentSpan(SEED_WITH_SHARED_URL_ACROSS_MOMENTS, 'vault-evermore-the-mismatch-moment');
    const validSpan = findMomentSpan(SEED_WITH_SHARED_URL_ACROSS_MOMENTS, 'vault-evermore-the-still-valid-moment');
    expect(mismatchSpan).not.toBeNull();
    expect(validSpan).not.toBeNull();
    expect(SEED_WITH_SHARED_URL_ACROSS_MOMENTS.slice(mismatchSpan.start, mismatchSpan.end)).toContain('Wrong Match');
    expect(SEED_WITH_SHARED_URL_ACROSS_MOMENTS.slice(validSpan.start, validSpan.end)).toContain('Correct Match');
  });
});

describe('removeProductForMoment (#3447 P2 round-4 review fix)', () => {
  it('removes the product from ONLY the moment named in productId, never a same-url product in another moment', () => {
    const demotion = {
      productId: `vault-evermore-the-mismatch-moment:0:${SHARED_URL}`,
      url: SHARED_URL,
    };
    const { source, removed } = removeProductForMoment(SEED_WITH_SHARED_URL_ACROSS_MOMENTS, demotion);

    expect(removed).toBe(true);
    expect(source).not.toContain('Wrong Match');
    // The other moment's identically-urled product survives untouched.
    expect(source).toContain('Correct Match');
    expect(source).toContain(SHARED_URL); // still present, just for the other moment
  });

  it('reports removed:false when the productId shape is invalid', () => {
    const { source, removed } = removeProductForMoment(SEED_WITH_TWO_PRODUCTS, { productId: 'garbage', url: 'x' });
    expect(removed).toBe(false);
    expect(source).toBe(SEED_WITH_TWO_PRODUCTS);
  });

  it('reports removed:false when the named moment does not exist in this file', () => {
    const demotion = { productId: 'vault-evermore-nonexistent:0:https://shop.example/x', url: 'https://shop.example/x' };
    const { removed } = removeProductForMoment(SEED_WITH_TWO_PRODUCTS, demotion);
    expect(removed).toBe(false);
  });
});

describe('removeProductByUrl', () => {
  it('removes only the product matching the given url, keeping the rest intact', () => {
    const { source, removed } = removeProductByUrl(
      SEED_WITH_TWO_PRODUCTS,
      'https://www.runwaycatalog.com/products/gucci-silk-floral-print-dress',
    );

    expect(removed).toBe(true);
    expect(source).not.toContain('Gucci');
    expect(source).toContain('Etro');
    // Still syntactically balanced: same number of '{' as '}'.
    expect((source.match(/\{/g) ?? []).length).toBe((source.match(/\}/g) ?? []).length);
  });

  it('reports removed:false and leaves source untouched when the url is not present', () => {
    const { source, removed } = removeProductByUrl(SEED_WITH_TWO_PRODUCTS, 'https://nope.example/x');
    expect(removed).toBe(false);
    expect(source).toBe(SEED_WITH_TWO_PRODUCTS);
  });

  it('never touches a url that only appears inside a comment or another string field', () => {
    const withDecoyComment = SEED_WITH_TWO_PRODUCTS.replace(
      "brand: 'Gucci',",
      "// url: 'https://www.etro.com/us-en/peau-d-ange-silk-long-dress.html' (old, dead link)\n            brand: 'Gucci',",
    );
    const { source, removed } = removeProductByUrl(
      withDecoyComment,
      'https://www.etro.com/us-en/peau-d-ange-silk-long-dress.html',
    );

    expect(removed).toBe(true);
    // The real Etro product object is gone...
    expect(source).not.toContain('A Different Dress');
    // ...but the decoy comment line (part of the Gucci object) survived,
    // because the comment sits inside the FIRST object, not the Etro one.
    expect(source).toContain('Gucci');
  });
});

describe('applyDemotions', () => {
  it('applies each demotion to whichever seed file contains its moment+url', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'apply-demotions-'));
    try {
      writeFileSync(join(dir, 'evermore.mjs'), SEED_WITH_TWO_PRODUCTS);
      writeFileSync(join(dir, 'folklore.mjs'), 'export default { eraSlug: "folklore", items: [] };\n');

      const result = await applyDemotions({
        demotions: [
          {
            productId: 'vault-evermore-a-moment:0:https://www.runwaycatalog.com/products/gucci-silk-floral-print-dress',
            url: 'https://www.runwaycatalog.com/products/gucci-silk-floral-print-dress',
          },
          { productId: 'vault-evermore-nonexistent:0:https://nowhere.example/product', url: 'https://nowhere.example/product' },
        ],
        seedDir: dir,
      });

      expect(result.applied).toHaveLength(1);
      expect(result.applied[0].file).toBe('evermore.mjs');
      expect(result.unresolved).toEqual([{
        productId: 'vault-evermore-nonexistent:0:https://nowhere.example/product',
        reason: 'moment or url not found in any seed file',
      }]);
      expect(result.filesChanged).toEqual([join(dir, 'evermore.mjs')]);

      const written = readFileSync(join(dir, 'evermore.mjs'), 'utf8');
      expect(written).not.toContain('Gucci');
      expect(written).toContain('Etro');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('removes only the audited moment even when another moment in the same file shares the url', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'apply-demotions-'));
    try {
      writeFileSync(join(dir, 'evermore.mjs'), SEED_WITH_SHARED_URL_ACROSS_MOMENTS);
      const result = await applyDemotions({
        demotions: [{ productId: `vault-evermore-the-mismatch-moment:0:${SHARED_URL}`, url: SHARED_URL }],
        seedDir: dir,
      });

      expect(result.applied).toHaveLength(1);
      const written = readFileSync(join(dir, 'evermore.mjs'), 'utf8');
      expect(written).not.toContain('Wrong Match');
      expect(written).toContain('Correct Match');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('records a demotion missing a url as unresolved without touching any file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'apply-demotions-'));
    try {
      writeFileSync(join(dir, 'evermore.mjs'), SEED_WITH_TWO_PRODUCTS);
      const result = await applyDemotions({ demotions: [{ productId: 'no-url' }], seedDir: dir });
      expect(result.unresolved).toEqual([{ productId: 'no-url', reason: 'no url on demotion' }]);
      expect(result.filesChanged).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('records a demotion with a malformed productId as unresolved without touching any file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'apply-demotions-'));
    try {
      writeFileSync(join(dir, 'evermore.mjs'), SEED_WITH_TWO_PRODUCTS);
      const result = await applyDemotions({
        demotions: [{ productId: 'garbage-shape', url: 'https://shop.example/x' }],
        seedDir: dir,
      });
      expect(result.unresolved).toEqual([{
        productId: 'garbage-shape',
        reason: 'productId does not match the moment:index:url shape',
      }]);
      expect(result.filesChanged).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

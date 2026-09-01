import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyDemotions, removeProductByUrl, scanArray } from './apply-demotions.mjs';

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

describe('scanArray', () => {
  it('finds each top-level object in a products array, ignoring nested braces', () => {
    const arrayStart = SEED_WITH_TWO_PRODUCTS.indexOf('products: [') + 'products: ['.length - 1;
    const { objects } = scanArray(SEED_WITH_TWO_PRODUCTS, arrayStart);
    expect(objects).toHaveLength(2);
    expect(SEED_WITH_TWO_PRODUCTS.slice(objects[0].start, objects[0].end)).toContain('Gucci');
    expect(SEED_WITH_TWO_PRODUCTS.slice(objects[1].start, objects[1].end)).toContain('Etro');
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
  it('applies each demotion to whichever seed file contains its url', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'apply-demotions-'));
    try {
      writeFileSync(join(dir, 'evermore.mjs'), SEED_WITH_TWO_PRODUCTS);
      writeFileSync(join(dir, 'folklore.mjs'), 'export default { eraSlug: "folklore", items: [] };\n');

      const result = await applyDemotions({
        demotions: [
          {
            productId: 'vault-evermore-x:0:https://www.runwaycatalog.com/products/gucci-silk-floral-print-dress',
            url: 'https://www.runwaycatalog.com/products/gucci-silk-floral-print-dress',
          },
          { productId: 'unfindable', url: 'https://nowhere.example/product' },
        ],
        seedDir: dir,
      });

      expect(result.applied).toHaveLength(1);
      expect(result.applied[0].file).toBe('evermore.mjs');
      expect(result.unresolved).toEqual([{ productId: 'unfindable', reason: 'url not found in any seed file' }]);
      expect(result.filesChanged).toEqual([join(dir, 'evermore.mjs')]);

      const written = readFileSync(join(dir, 'evermore.mjs'), 'utf8');
      expect(written).not.toContain('Gucci');
      expect(written).toContain('Etro');
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
});

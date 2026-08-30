import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { shopifyJsonUrl } from './product-liveness.mjs';
import {
  acknowledgedUnavailableUrlSet,
  classifyAcknowledgedUnavailable,
  productTargets,
} from '../check-link-liveness.mjs';

describe('shopifyJsonUrl', () => {
  it('maps a /products/<handle> url to its Shopify JSON companion', () => {
    expect(
      shopifyJsonUrl('https://bcbg.com/products/oly-tiered-ruffle-tulle-evening-gown-in-black'),
    ).toBe('https://bcbg.com/products/oly-tiered-ruffle-tulle-evening-gown-in-black.json');
  });

  it('strips a trailing slash before appending .json', () => {
    expect(shopifyJsonUrl('https://example.com/products/some-handle/')).toBe(
      'https://example.com/products/some-handle.json',
    );
  });

  it('ignores a query string on the product url', () => {
    expect(shopifyJsonUrl('https://www.tecovas.com/products/the-loretta?color=midnight-goat')).toBe(
      'https://www.tecovas.com/products/the-loretta.json',
    );
  });

  it('returns null for a url not shaped like /products/<handle>', () => {
    expect(
      shopifyJsonUrl(
        'https://us.balmain.com/en/p/sleeveless-lambskin-jumpsuit-FF0QO025LE040DA.html',
      ),
    ).toBeNull();
  });

  it('returns null for an unparseable url', () => {
    expect(shopifyJsonUrl('not a url')).toBeNull();
  });
});

describe('productTargets', () => {
  it('keeps an explicitly unavailable product in the liveness sweep', () => {
    expect(
      productTargets({
        products: [
          { url: 'https://example.com/available', category: 'shop-the-look' },
          { url: 'https://example.com/unavailable', category: 'shop-the-look', inStock: false },
        ],
      }).map((target) => target.url),
    ).toEqual(['https://example.com/available', 'https://example.com/unavailable']);
  });

  it('labels only a uniquely targeted acknowledged URL without masking duplicates', async () => {
    const artifact = JSON.parse(
      await readFile('artifacts/merch-audit/e1-re-source-2026-08-30.json', 'utf8'),
    );
    const url =
      'https://jacksonswestern.com/wrangler-women-s-multicolor-rainbow-bandana-western-snap-shirt/';
    const acknowledged = acknowledgedUnavailableUrlSet(
      [{ productId: 'sweep-product', url }],
      artifact.reSource,
    );
    expect(
      classifyAcknowledgedUnavailable(
        { productId: 'sweep-product', url, verdict: 'dead' },
        acknowledged,
      ).verdict,
    ).toBe('known-unavailable');

    const duplicateAcknowledgements = acknowledgedUnavailableUrlSet(
      [
        { productId: 'audited-product', url },
        { productId: 'duplicate-product', url },
      ],
      artifact.reSource,
    );
    expect(
      classifyAcknowledgedUnavailable(
        { productId: 'duplicate-product', url, verdict: 'dead' },
        duplicateAcknowledgements,
      ).verdict,
    ).toBe('dead');
  });
});

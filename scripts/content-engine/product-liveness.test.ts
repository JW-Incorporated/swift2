import { describe, expect, it } from 'vitest';
import { shopifyJsonUrl } from './product-liveness.mjs';
import { classifyAcknowledgedUnavailable, productTargets } from '../check-link-liveness.mjs';

describe('shopifyJsonUrl', () => {
  it('maps a /products/<handle> url to its Shopify JSON companion', () => {
    expect(shopifyJsonUrl('https://bcbg.com/products/oly-tiered-ruffle-tulle-evening-gown-in-black')).toBe(
      'https://bcbg.com/products/oly-tiered-ruffle-tulle-evening-gown-in-black.json',
    );
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
    expect(shopifyJsonUrl('https://us.balmain.com/en/p/sleeveless-lambskin-jumpsuit-FF0QO025LE040DA.html')).toBeNull();
  });

  it('returns null for an unparseable url', () => {
    expect(shopifyJsonUrl('not a url')).toBeNull();
  });
});

describe('productTargets', () => {
  it('keeps an explicitly unavailable product in the liveness sweep', () => {
    expect(productTargets({
      products: [
        { url: 'https://example.com/available', category: 'shop-the-look' },
        { url: 'https://example.com/unavailable', category: 'shop-the-look', inStock: false },
      ],
    }).map((target) => target.url)).toEqual([
      'https://example.com/available',
      'https://example.com/unavailable',
    ]);
  });

  it('labels only an acknowledged unavailable URL without masking other dead links', () => {
    const acknowledged = new Set(['https://example.com/acknowledged']);
    expect(classifyAcknowledgedUnavailable({ url: 'https://example.com/acknowledged', verdict: 'dead' }, acknowledged).verdict).toBe('known-unavailable');
    expect(classifyAcknowledgedUnavailable({ url: 'https://example.com/other', verdict: 'dead' }, acknowledged).verdict).toBe('dead');
  });
});

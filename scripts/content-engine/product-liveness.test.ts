import { describe, expect, it } from 'vitest';
import { shopifyJsonUrl } from './product-liveness.mjs';

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

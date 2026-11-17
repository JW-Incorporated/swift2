// @vitest-environment jsdom
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@swift2/content-enrichment', () => ({ merchProductJsonLd: () => ({}) }));
vi.mock('@swift2/ui', () => ({
  useReader: () => ({ getContentItem: () => undefined }),
  useHost: () => ({ env: {} }),
}));
vi.mock('../store', () => ({ useAppActions: () => ({ openItem: () => undefined }) }));
vi.mock('../moment/lib/shop', () => ({
  AMAZON_DISCLOSURE: '',
  SHOP_DISCLOSURE: '',
  createHostShopLinkRenderer: () => ({
    forMerchItem: () => ({ href: 'https://shop.example/x', isAffiliate: false }),
    isAmazonMerchItem: () => false,
    isAmazonMerch: () => false,
  }),
}));

import { MerchCard } from './MerchCard';

afterEach(cleanup);

// WCAG 2.5.3: the shop link's accessible name contains its visible "Shop it · {price}".
describe('MerchCard shop link accessible name', () => {
  it('starts with the visible text and keeps brand, item and stock context', () => {
    const item = {
      category: 'official-store',
      brand: 'Acme',
      item: 'Tour Hoodie',
      price: '$55',
      inStock: false,
    } as never;
    render(createElement('ul', null, createElement(MerchCard, { item })));
    const link = screen.getByRole('link', { name: /^Shop it · \$55/ });
    expect(link.hasAttribute('aria-label')).toBe(false);
    expect(link.textContent).toContain('Acme Tour Hoodie (sold out)');
    expect(link.getAttribute('href')).toBe('https://shop.example/x');
    expect(link.getAttribute('rel')).toBe('nofollow sponsored noopener noreferrer');
  });
});

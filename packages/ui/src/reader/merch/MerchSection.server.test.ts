import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const { newDrops } = vi.hoisted(() => ({
  newDrops: vi.fn(() => [{ url: 'https://example.com/new-drop' }]),
}));

vi.mock('@swift2/content-enrichment', () => ({ newDrops }));
vi.mock('@swift2/ui', () => ({
  ReaderExtensionsProvider: ({ children }: { children: unknown }) => children,
  useHost: () => ({ env: {} }),
  useMerch: () => ({ officialStore: [{ url: 'https://example.com/new-drop' }], fanMade: [], shopTheLook: [] }),
}));
vi.mock('../moment/lib/shop', () => ({ createHostShopLinkRenderer: () => ({ hasAffiliateMerch: () => false }), SHOP_DISCLOSURE: '' }));
vi.mock('./lib/section-jump', () => ({ suggestLinkSectionId: () => 'suggest-link' }));
vi.mock('./SubmitLinkForm', () => ({ SubmitLinkForm: () => null }));
vi.mock('./MerchMarquee', () => ({ MerchMarquee: () => null }));
vi.mock('./MerchSectionRail', () => ({ MerchSectionRail: () => null }));
vi.mock('./MerchStyleSection', () => ({ MerchStyleSection: () => null }));
vi.mock('./MerchEmptyPanel', () => ({ MerchEmptyPanel: () => null }));
vi.mock('./MerchCard', () => ({ MerchCard: () => null }));

import { MerchSectionBody } from './MerchSection';

describe('MerchSection new drops', () => {
  it('does not calculate time-sensitive drops during server rendering', () => {
    const html = renderToStaticMarkup(createElement(MerchSectionBody));

    expect(newDrops).not.toHaveBeenCalled();
    expect(html).not.toContain('Just landed');
  });
});

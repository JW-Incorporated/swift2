import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const { merch } = vi.hoisted(() => ({
  merch: { officialStore: [] as unknown[], fanMade: [] as unknown[], shopTheLook: [] as unknown[] },
}));

vi.mock('@swift2/content-enrichment', () => ({ newDrops: () => [] }));
vi.mock('@swift2/ui', () => ({
  ReaderExtensionsProvider: ({ children }: { children: unknown }) => children,
  useHost: () => ({ env: {} }),
  useMerch: () => merch,
}));
vi.mock('../moment/lib/shop', () => ({ createHostShopLinkRenderer: () => ({ hasAffiliateMerch: () => false, hasAmazonMerch: () => false }), SHOP_DISCLOSURE: '', AMAZON_DISCLOSURE: '' }));
vi.mock('./lib/section-jump', () => ({ suggestLinkSectionId: () => 'suggest-link' }));
vi.mock('./SubmitLinkForm', () => ({ SubmitLinkForm: () => null }));
vi.mock('./MerchMarquee', () => ({ MerchMarquee: () => null }));
vi.mock('./MerchSectionRail', () => ({ MerchSectionRail: () => null }));
vi.mock('./MerchStyleSection', () => ({ MerchStyleSection: () => null }));
vi.mock('./MerchEmptyPanel', () => ({ MerchEmptyPanel: () => null }));
vi.mock('./MerchCard', () => ({ MerchCard: () => null }));

import { MerchSectionBody } from './MerchSection';

const html = () => renderToStaticMarkup(createElement(MerchSectionBody));
const item = { url: 'https://example.com/x' };

describe('MerchSection section header copy', () => {
  it('uses the empty-state sentences only while a list is empty', () => {
    merch.officialStore = [];
    merch.fanMade = [];
    const empty = html();
    expect(empty).toContain('Nothing&#x27;s been vetted yet');
    expect(empty).toContain('when we have a vetted feed for it');
  });

  it('drops the empty-state sentences once the lists have items', () => {
    merch.officialStore = [item];
    merch.fanMade = [item];
    const full = html();
    expect(full).not.toContain('been vetted yet');
    expect(full).not.toContain('when we have a vetted feed for it');
    expect(full).toContain('Pulled straight from the official store.');
    expect(full).toContain('One maker per listing, hand-checked before it&#x27;s added.');
  });
});

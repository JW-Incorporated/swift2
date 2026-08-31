import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const { newDrops } = vi.hoisted(() => ({
  newDrops: vi.fn(() => [{ url: 'https://example.com/new-drop' }]),
}));

vi.mock('@/lib/longlive/merch', () => ({
  MERCH_CATALOGUE: {
    officialStore: [{ url: 'https://example.com/new-drop' }],
    fanMade: [],
    shopTheLook: [],
  },
  newDrops,
}));
vi.mock('@/lib/longlive/shop', () => ({ hasAffiliateMerch: () => false, SHOP_DISCLOSURE: '' }));
vi.mock('@/lib/longlive/section-jump', () => ({ suggestLinkSectionId: () => 'suggest-link' }));
vi.mock('./SubmitLinkForm', () => ({ SubmitLinkForm: () => null }));
vi.mock('./merch/MerchMarquee', () => ({ MerchMarquee: () => null }));
vi.mock('./merch/MerchSectionRail', () => ({ MerchSectionRail: () => null }));
vi.mock('./merch/MerchStyleSection', () => ({ MerchStyleSection: () => null }));
vi.mock('./merch/MerchEmptyPanel', () => ({ MerchEmptyPanel: () => null }));
vi.mock('./merch/MerchCard', () => ({ MerchCard: () => null }));

import { MerchSection } from './MerchSection';

describe('MerchSection new drops', () => {
  it('does not calculate time-sensitive drops during server rendering', () => {
    const html = renderToStaticMarkup(createElement(MerchSection));

    expect(newDrops).not.toHaveBeenCalled();
    expect(html).not.toContain('Just landed');
  });
});

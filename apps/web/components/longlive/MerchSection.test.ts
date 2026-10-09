/**
 * Regression for the merch-card alt-piece clarity fix: `altNote` must render
 * as visible DOM text, not only inside a hover `title` attribute — the exact
 * defect Joey flagged (invisible explanation on touch devices).
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostProvider } from '@swift2/ui';
import { createWebRootAdapter } from '@/lib/host-adapter';
import type { MerchItem } from '@/lib/longlive/merch';
import { MerchCard } from './merch/MerchCard';
import { TestHostProvider } from '@/lib/test-host';
import { WebReaderSnapshotProvider } from '@/lib/longlive/reader-snapshot-provider';

vi.mock('@swift2/ui/reader/store/index', () => ({
  useAppActions: () => ({ openItem: vi.fn() }),
}));

vi.mock('next/image', () => ({
  default: (props: { alt: string }) => createElement('img', { alt: props.alt }),
}));

// lucide-react resolves its own 'react' from the workspace root (a different
// copy than apps/web's nested react@19), which makes react-dom/server reject
// its elements as "not valid as a React child". Not under test here — stub it.
vi.mock('lucide-react', () => ({
  ExternalLink: () => createElement('svg', { 'aria-hidden': 'true' }),
}));

const baseItem: MerchItem = {
  brand: 'Etro',
  item: 'Silk Gown',
  retailer: 'etro.com',
  url: 'https://www.etro.com/product/silk-gown',
  price: '$1,200.00',
  category: 'shop-the-look',
};

/** Strips every `title="..."` attribute before checking for text — proves a
 * match came from element content, not a hover-only tooltip. */
function withoutTitleAttrs(html: string): string {
  return html.replace(/title="[^"]*"/g, '');
}

afterEach(() => vi.unstubAllEnvs());

describe('MerchCard alt-piece clarity', () => {
  it('renders the altNote as visible DOM text, not only in a title attribute', () => {
    const altNote =
      'The exact custom Etro gown was a one-off runway piece — this is the closest current silhouette.';
    const item: MerchItem = { ...baseItem, isAlternative: true, altNote };
    const html = renderToStaticMarkup(createElement(TestHostProvider, null, createElement(WebReaderSnapshotProvider, null, createElement(MerchCard, { item }))));

    expect(withoutTitleAttrs(html)).toContain(altNote);
    expect(html).toContain('We found something similar');
  });

  it('does not show the "similar" warning for an exact-piece item', () => {
    const item: MerchItem = { ...baseItem };
    const html = renderToStaticMarkup(createElement(TestHostProvider, null, createElement(WebReaderSnapshotProvider, null, createElement(MerchCard, { item }))));

    expect(html).toContain('The exact piece');
    expect(html).not.toContain('We found something similar');
  });

  it('uses the scored match tier for the visible badge and alternative disclosure', () => {
    const item: MerchItem = { ...baseItem, matchTier: 'close', altNote: 'A close verified match.' };
    const html = renderToStaticMarkup(createElement(TestHostProvider, null, createElement(WebReaderSnapshotProvider, null, createElement(MerchCard, { item }))));

    expect(html).toContain('close match');
    expect(html).toContain('We found something similar');
  });

  it('labels standalone official items as official, not as an exact look match', () => {
    const item: MerchItem = { ...baseItem, category: 'official-store' };
    const html = renderToStaticMarkup(createElement(TestHostProvider, null, createElement(WebReaderSnapshotProvider, null, createElement(MerchCard, { item }))));

    expect(html).toContain('Official item');
    expect(html).not.toContain('The exact piece');
  });

  it('web root adapter env.affiliate (same NEXT_PUBLIC vars as before) tags an Amazon alternate listing and shows the disclosure', () => {
    vi.stubEnv('NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG', 'longlive-20');
    const adapter = createWebRootAdapter({ push() {}, replace() {} });
    const item: MerchItem = {
      ...baseItem,
      category: 'official-store',
      altListing: { retailer: 'amazon.com', url: 'https://www.amazon.com/dp/B123' },
    };
    const html = renderToStaticMarkup(createElement(HostProvider, { adapter }, createElement(WebReaderSnapshotProvider, null, createElement(MerchCard, { item }))));

    expect(html).toContain('https://www.amazon.com/dp/B123?tag=longlive-20&amp;ascsubtag=official');
    expect(html).toContain('commission at no extra cost to you');
    expect(html).toContain('As an Amazon Associate I earn from qualifying purchases.');
    expect(html.indexOf('As an Amazon Associate')).toBeLessThan(html.indexOf('href="https://www.amazon.com'));
  });

  it('a host with no env.affiliate (the app) renders plain retailer URLs and no disclosure, even if the process env has tags', () => {
    vi.stubEnv('NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG', 'longlive-20');
    const item: MerchItem = {
      ...baseItem,
      category: 'official-store',
      altListing: { retailer: 'amazon.com', url: 'https://www.amazon.com/dp/B123' },
    };
    const html = renderToStaticMarkup(createElement(TestHostProvider, null, createElement(WebReaderSnapshotProvider, null, createElement(MerchCard, { item }))));

    expect(html).toContain('href="https://www.amazon.com/dp/B123"');
    expect(html).not.toMatch(/tag=|ascsubtag/);
    expect(html).not.toContain('commission');
    expect(html).not.toContain('Amazon Associate');
  });

  it('emits schema.org Product JSON-LD for every card (SPEC.merch-autonomy.md §9)', () => {
    const item: MerchItem = { ...baseItem, imageUrl: 'https://www.etro.com/img/gown.jpg' };
    const html = renderToStaticMarkup(createElement(TestHostProvider, null, createElement(WebReaderSnapshotProvider, null, createElement(MerchCard, { item }))));

    expect(html).toContain('"@type":"Product"');
    expect(html).toContain('"name":"Silk Gown"');
    expect(html).toContain('"brand":{"@type":"Brand","name":"Etro"}');
    expect(html).toContain('"image":"https://www.etro.com/img/gown.jpg"');
  });

  it('omits the offers block when the item has no fresh machine-verified price/stock', () => {
    const item: MerchItem = { ...baseItem };
    const html = renderToStaticMarkup(createElement(TestHostProvider, null, createElement(WebReaderSnapshotProvider, null, createElement(MerchCard, { item }))));

    expect(html).toContain('"@type":"Product"');
    expect(html).not.toContain('"offers"');
  });
});

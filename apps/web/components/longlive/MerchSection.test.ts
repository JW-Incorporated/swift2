/**
 * Regression for the merch-card alt-piece clarity fix: `altNote` must render
 * as visible DOM text, not only inside a hover `title` attribute — the exact
 * defect Joey flagged (invisible explanation on touch devices).
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { MerchItem } from '@/lib/longlive/merch';
import { MerchCard } from './merch/MerchCard';

vi.mock('@/lib/longlive/store', () => ({
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

describe('MerchCard alt-piece clarity', () => {
  it('renders the altNote as visible DOM text, not only in a title attribute', () => {
    const altNote = 'The exact custom Etro gown was a one-off runway piece — this is the closest current silhouette.';
    const item: MerchItem = { ...baseItem, isAlternative: true, altNote };
    const html = renderToStaticMarkup(createElement(MerchCard, { item }));

    expect(withoutTitleAttrs(html)).toContain(altNote);
    expect(html).toContain('We found something similar');
  });

  it('does not show the "similar" warning for an exact-piece item', () => {
    const item: MerchItem = { ...baseItem };
    const html = renderToStaticMarkup(createElement(MerchCard, { item }));

    expect(html).toContain('The exact piece');
    expect(html).not.toContain('We found something similar');
  });
});

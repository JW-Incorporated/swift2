import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getEra, type ContentItem } from '@swift2/experience';
import { HostProvider } from '../../host/context';
import type { HostAdapter, HostImageProps } from '../../host/types';
import { FromTheEras } from './FromTheEras';

// #6266: each cross-link card <button> carried
// aria-label="Open “<title>” (<era>, <date>)" while its visible text renders
// title, then "<era> · <date>" — the visible text was never a substring of
// the accessible name, so axe `label-content-name-mismatch` (WCAG 2.5.3
// Label in Name) failed on every card. The fix drops the override so the
// name derives from the visible content.

vi.mock('../store', () => ({ useAppActions: () => ({ openItem: () => undefined }) }));

const Img = ({ src, alt }: HostImageProps) => createElement('img', { src, alt });
const item = {
  id: 'i1',
  eraId: 'fearless',
  title: 'Love Story video premiere',
  dateLabel: 'Sep 2008',
  images: [{ url: '/x.jpg', alt: '', kind: 'primary' }],
} as unknown as ContentItem;

const html = renderToStaticMarkup(
  createElement(
    HostProvider,
    { adapter: { Image: Img } as HostAdapter },
    createElement(FromTheEras, { items: [item] }),
  ),
);
const button = html.slice(html.indexOf('<button'), html.indexOf('</button>'));

describe('From the Eras cross-link card label (WCAG 2.5.3)', () => {
  it('has no aria-label overriding its visible text', () => {
    expect(button).not.toContain('aria-label');
  });

  it('derives its name from visible title, era and date', () => {
    expect(button).toContain(item.title);
    expect(button).toContain(getEra('fearless').shortName);
    expect(button).toContain(item.dateLabel);
  });
});

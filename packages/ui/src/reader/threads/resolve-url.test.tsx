import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ContentItem } from '@swift2/experience';
import { HostProvider } from '../../host/context';
import type { HostAdapter, HostImageProps } from '../../host/types';
import { FromTheEras } from './FromTheEras';

vi.mock('../store', () => ({ useAppActions: () => ({ openItem: () => undefined }) }));

const ORIGIN = 'https://longlivets.com';
const Img = ({ src, alt }: HostImageProps) => createElement('img', { src, alt });
const item = {
  id: 'i1',
  eraId: 'fearless',
  title: 'T',
  dateLabel: 'D',
  images: [{ url: '/threads/end-game-travis-kelce.jpg', alt: '', kind: 'primary' }],
} as unknown as ContentItem;

function html(adapter: Partial<HostAdapter>): string {
  return renderToStaticMarkup(
    createElement(
      HostProvider,
      { adapter: { Image: Img, ...adapter } as HostAdapter },
      createElement(FromTheEras, { items: [item] }),
    ),
  );
}

describe('threads surface resolves root-relative asset urls through the host', () => {
  it('app host (resolveUrl) canonicalises the path', () => {
    const resolveUrl = (p: string) => (p.startsWith('/') && !p.startsWith('//') ? `${ORIGIN}${p}` : p);
    expect(html({ resolveUrl })).toContain(`src="${ORIGIN}/threads/end-game-travis-kelce.jpg"`);
  });

  it('web host (no resolveUrl) is unchanged', () => {
    expect(html({})).toContain('src="/threads/end-game-travis-kelce.jpg"');
  });
});

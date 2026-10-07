import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ContentItem } from '@swift2/experience';
import { HostProvider } from '../../host/context';
import type { HostAdapter, HostImageProps } from '../../host/types';
import { RelatedMomentsRail } from './MomentDetail';
import type { RelatedMoment } from './lib/related';

const ORIGIN = 'https://longlivets.com';
const Img = ({ src, alt }: HostImageProps) => createElement('img', { src, alt });
const resolveUrl = (p: string) => (p.startsWith('/') && !p.startsWith('//') ? `${ORIGIN}${p}` : p);

function html(url: string, adapter: Partial<HostAdapter>): string {
  const item = {
    id: 'i1',
    eraId: 'lover',
    title: 'T',
    dateLabel: 'D',
    images: [{ url, alt: '', kind: 'primary' }],
  } as unknown as ContentItem;
  const related = [{ item, eraId: 'lover' }] as unknown as RelatedMoment[];
  return renderToStaticMarkup(
    createElement(
      HostProvider,
      { adapter: { Image: Img, ...adapter } as HostAdapter },
      createElement(RelatedMomentsRail, { related, onOpen: () => {} }),
    ),
  );
}

describe('moment detail resolves root-relative era-art urls through the host', () => {
  it('app host canonicalises a root-relative path', () => {
    expect(html('/eras/lover.png', { resolveUrl })).toContain(`src="${ORIGIN}/eras/lover.png"`);
  });

  it('web host (no resolveUrl) is unchanged', () => {
    expect(html('/eras/lover.png', {})).toContain('src="/eras/lover.png"');
  });

  it('absolute urls are untouched under the app host', () => {
    expect(html('https://img.example.com/a.jpg', { resolveUrl })).toContain('src="https://img.example.com/a.jpg"');
  });
});

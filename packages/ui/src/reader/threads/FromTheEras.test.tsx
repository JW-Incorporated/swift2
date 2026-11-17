// @vitest-environment jsdom
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEra, type ContentItem } from '@swift2/experience';
import { HostProvider } from '../../host/context';
import type { HostAdapter, HostImageProps } from '../../host/types';
import { FromTheEras } from './FromTheEras';

vi.mock('../store', () => ({ useAppActions: () => ({ openItem: () => undefined }) }));

afterEach(cleanup);

const Img = ({ src, alt }: HostImageProps) => createElement('img', { src, alt });
const item = {
  id: 'i1',
  eraId: 'fearless',
  title: 'Love Story video premiere',
  dateLabel: 'Sep 2008',
  images: [{ url: '/x.jpg', alt: '', kind: 'primary' }],
} as unknown as ContentItem;

// #6266 / WCAG 2.5.3: the card's accessible name derives from its visible text.
describe('FromTheEras card accessible name', () => {
  it('contains the visible title, era and date, with no aria-label', () => {
    render(
      createElement(
        HostProvider,
        { adapter: { Image: Img } as unknown as HostAdapter },
        createElement(FromTheEras, { items: [item] }),
      ),
    );
    const button = screen.getByRole('button', { name: /Love Story video premiere/ });
    expect(button.hasAttribute('aria-label')).toBe(false);
    expect(button.textContent).toContain(`${getEra('fearless').shortName} · Sep 2008`);
  });
});

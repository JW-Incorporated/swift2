// @vitest-environment jsdom
// Content fix 4/6: CurrentItemCard renders item.imageUrl (responsive, lazy,
// headline alt text, graceful onError hide) above the summary, keeping the
// dashed live styling and data-ll-* anchors intact.
import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CurrentItem } from '@swift2/shared';
import { HostProvider } from '../../host/context';
import type { HostAdapter, HostImageProps } from '../../host/types';
import { CurrentItemCard } from './CurrentItemCard';

const RealImage = ({ src, alt, onError }: HostImageProps) =>
  createElement('img', { src, alt, onError });

function adapter(overrides?: Partial<HostAdapter>): HostAdapter {
  return { Image: RealImage, ...overrides } as HostAdapter;
}

const baseItem = {
  id: 'ci-1',
  eraId: 'tortured-poets',
  observedOn: '2026-10-01',
  headline: 'Taylor spotted at the diner',
  summary: 'A one-line summary of what happened.',
  detail: 'A longer paragraph of real detail.',
  status: 'reported',
  sources: [],
} as unknown as CurrentItem;

function mount(item: CurrentItem, onOpen = () => {}) {
  return render(
    createElement(
      HostProvider,
      { adapter: adapter() },
      createElement(CurrentItemCard, {
        item,
        eraId: 'tortured-poets' as never,
        sortDate: item.observedOn,
        displayDate: item.observedOn,
        onOpen,
      }),
    ),
  );
}

describe('CurrentItemCard image rendering', () => {
  it('renders the hotlinked image, lazy-loaded, with the headline as alt text', () => {
    const item = { ...baseItem, imageUrl: 'https://publisher.example/photo.jpg' };
    mount(item);
    const img = screen.getByAltText(item.headline) as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(item.imageUrl);
  });

  it('renders nothing in the image slot when imageUrl is absent', () => {
    mount({ ...baseItem, imageUrl: undefined });
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('hides the image slot after it fails to load (onError)', () => {
    const item = { ...baseItem, imageUrl: 'https://publisher.example/broken.jpg' };
    mount(item);
    const img = screen.getByAltText(item.headline);
    fireEvent.error(img);
    expect(screen.queryByAltText(item.headline)).toBeNull();
  });

  it('still renders the summary, dashed live styling and data-ll-* anchors', () => {
    const item = { ...baseItem, imageUrl: 'https://publisher.example/photo.jpg' };
    const { container } = mount(item);
    expect(screen.getByText(item.summary)).toBeTruthy();
    const li = container.querySelector('li')!;
    expect(li.getAttribute('data-ll-item')).toBe(`era-current-${item.id}`);
    expect(li.getAttribute('data-ll-era')).toBe('tortured-poets');
    expect(li.getAttribute('data-ll-exact')).toBe('1');
    const button = container.querySelector('button')!;
    expect(button.className).toContain('border-dashed');
  });

  it('opens the detail view on click', () => {
    const onOpen = vi.fn();
    mount({ ...baseItem, imageUrl: undefined }, onOpen);
    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

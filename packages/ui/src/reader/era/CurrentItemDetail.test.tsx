// @vitest-environment jsdom
// W2a: CurrentItemDetail renders the item image (next/image, unoptimized,
// headline alt) and readable, de-duplicated source links instead of a stack
// of bare external-link icons.
import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CurrentItem } from '@swift2/shared';
import { ERAS } from '@swift2/experience';
import { HostProvider } from '../../host/context';
import type { HostAdapter, HostImageProps } from '../../host/types';
import { CurrentItemDetail } from './CurrentItemDetail';

vi.mock('../store', () => ({
  useAppActions: () => ({ goHome: vi.fn() }),
}));

const RealImage = ({ src, alt, onError }: HostImageProps) =>
  createElement('img', { src, alt, onError });

function adapter(overrides?: Partial<HostAdapter>): HostAdapter {
  return {
    Image: RealImage,
    apiFetch: () => Promise.resolve(new Response(null, { status: 200 })),
    ...overrides,
  } as HostAdapter;
}

const item = {
  id: 'ci-1',
  eraId: 'tortured-poets',
  observedOn: '2026-11-03',
  headline: 'Taylor announces new tour',
  summary: 'A short summary.',
  detail: 'A longer detail.',
  status: 'reported',
  imageUrl: 'https://example.com/photo.jpg',
  sources: [
    { name: 'Rolling Stone', url: 'https://rollingstone.com/a', tier: 'major' },
    { name: '', url: 'https://www.bbc.co.uk/news/a', tier: 'major' },
    { name: '', url: 'https://www.bbc.co.uk/news/b', tier: 'major' },
  ],
} as unknown as CurrentItem;

function mount() {
  return render(
    createElement(
      HostProvider,
      { adapter: adapter() },
      createElement(CurrentItemDetail, {
        item,
        era: ERAS[0]!,
        onClose: () => {},
      }),
    ),
  );
}

describe('CurrentItemDetail', () => {
  it('renders the item image when imageUrl is present', () => {
    mount();
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg');
    expect(img.getAttribute('alt')).toBe('Taylor announces new tour');
  });

  it('renders readable de-duplicated source links', () => {
    mount();
    expect(screen.getByText('Sources:')).toBeTruthy();
    const links = screen.getAllByRole('link');
    const labels = links.map((link) => link.textContent);
    expect(labels).toContain('Rolling Stone');
    expect(labels).toContain('BBC');
    expect(links).toHaveLength(2);
  });

  it('plays a video embed in place of the image', () => {
    const video = {
      ...item,
      mediaKind: 'video',
      embed: { provider: 'youtube', videoId: 'dQw4w9WgXcQ', title: 'Official video' },
    } as unknown as CurrentItem;
    const { container } = render(
      createElement(
        HostProvider,
        { adapter: adapter() },
        createElement(CurrentItemDetail, { item: video, era: ERAS[0]!, onClose: () => {} }),
      ),
    );
    expect(container.querySelector('iframe')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Play video: Official video' }));
    expect(container.querySelector('iframe')!.getAttribute('src')).toContain('/embed/dQw4w9WgXcQ');
    expect(screen.queryByRole('img')).toBeNull();
  });
});

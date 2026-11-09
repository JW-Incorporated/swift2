// @vitest-environment jsdom
// W2a: CurrentItemDetail renders the item image (next/image, unoptimized,
// headline alt) and readable, de-duplicated source links instead of a stack
// of bare external-link icons.
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CurrentItem } from '@swift2/shared';
import { ERAS } from '@swift2/experience';
import { HostProvider } from '../../host/context';
import type { HostAdapter, HostImageProps } from '../../host/types';
import { CurrentItemDetail, splitParagraphs } from './CurrentItemDetail';

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
  detail: 'First paragraph of the body.\n\nSecond paragraph of the body.\nThird paragraph of the body.',
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

  it('renders the body as one <p> per newline-separated paragraph', () => {
    mount();
    expect(screen.getByText('First paragraph of the body.').tagName).toBe('P');
    expect(screen.getByText('Second paragraph of the body.').tagName).toBe('P');
    expect(screen.getByText('Third paragraph of the body.').tagName).toBe('P');
  });

  it('keeps the status mandatory as a compact chip plus a footer explanation', () => {
    mount();
    const chip = screen.getByRole('note', { name: 'Reported — not confirmed' });
    expect(chip.tagName).toBe('SPAN');
    expect(chip.textContent).toBe('Reported — not confirmed');
    const footer = screen.getByRole('complementary', { name: 'About this story' });
    expect(footer.textContent).toContain('Not confirmed by Taylor, her team, or an official source.');
    expect(footer.textContent).toContain('Help us verify this');
  });

  it('reads top to bottom: eyebrow, headline, image, lead, body, footer', () => {
    const { container } = mount();
    const html = container.innerHTML;
    const order = [
      'reported by Rolling Stone',
      'Taylor announces new tour</h1>',
      'photo.jpg',
      'A short summary.',
      'First paragraph of the body.',
      'Sources:',
    ].map((needle) => html.indexOf(needle));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

describe('splitParagraphs', () => {
  it('splits on any run of newlines, trims, and drops blanks', () => {
    expect(splitParagraphs('a\n\nb\n c \n\n\n')).toEqual(['a', 'b', 'c']);
    expect(splitParagraphs('single')).toEqual(['single']);
  });
});
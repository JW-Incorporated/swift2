// @vitest-environment jsdom
// Media rule: a live theory card renders its evidence image (headline-style
// alt text, lazy) and, like CurrentItemCard, hides just the slot on onError.
import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LiveTheory } from '@swift2/shared';
import { HostProvider } from '../../host/context';
import type { HostAdapter, HostImageProps } from '../../host/types';
import { LiveTheoryCard } from './LiveTheoryCard';

const RealImage = ({ src, alt, onError }: HostImageProps) => createElement('img', { src, alt, onError });

const theory = {
  id: 't-1',
  name: 'The owl theory',
  claim: 'The owl means a reveal.',
  origin: 'fan',
  heat: 2,
} as unknown as LiveTheory;

function mount(t: LiveTheory) {
  return render(
    createElement(
      HostProvider,
      { adapter: { Image: RealImage } as unknown as HostAdapter },
      createElement('ul', null, createElement(LiveTheoryCard, { theory: t })),
    ),
  );
}

describe('LiveTheoryCard image rendering', () => {
  it('renders the evidence image with the theory name as alt text', () => {
    mount({ ...theory, imageUrl: 'https://www.people.com/photo.jpg' });
    const img = screen.getByAltText('The owl theory') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('https://www.people.com/photo.jpg');
  });

  it('hides the image slot after it fails to load', () => {
    mount({ ...theory, imageUrl: 'https://www.people.com/photo.jpg' });
    fireEvent.error(screen.getByAltText('The owl theory'));
    expect(screen.queryByRole('img')).toBeNull();
  });
});

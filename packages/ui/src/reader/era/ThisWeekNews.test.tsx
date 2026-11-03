// @vitest-environment jsdom
import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CurrentItem } from '@swift2/shared';
import type { FilterId } from '@swift2/experience';
import { HostProvider } from '../../host/context';
import type { HostAdapter, HostImageProps } from '../../host/types';
import { ThisWeekNews } from './ThisWeekNews';

const RealImage = ({ src, alt, onError }: HostImageProps) => createElement('img', { src, alt, onError });
const adapter = { Image: RealImage } as unknown as HostAdapter;

const mk = (id: string, headline: string, observedOn: string, name = 'People'): CurrentItem =>
  ({
    id,
    eraId: 'tloas',
    observedOn,
    headline,
    summary: 's',
    status: 'reported',
    imageUrl: 'https://www.people.com/photo.jpg',
    sources: [{ name, url: 'https://www.people.com/story', tier: 'established' }],
  }) as unknown as CurrentItem;

const items = [mk('a', 'Newest headline', '2026-11-02'), mk('b', 'Second headline', '2026-10-31', '')];

function mount(props: { items?: CurrentItem[]; filters?: ReadonlySet<FilterId>; onOpen?: (i: CurrentItem) => void }) {
  return render(
    createElement(
      HostProvider,
      { adapter },
      createElement(ThisWeekNews, {
        items: props.items ?? items,
        filters: props.filters ?? new Set<FilterId>(),
        onOpen: props.onOpen ?? (() => {}),
      }),
    ),
  );
}

describe('ThisWeekNews', () => {
  it('collapsed: shows count and the newest headline only', () => {
    mount({});
    const toggle = screen.getByRole('button', { name: /This week's news/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('2 stories')).toBeTruthy();
    expect(screen.getByText('Newest headline')).toBeTruthy();
    expect(screen.queryByText('Second headline')).toBeNull();
  });

  it('expands on click and lists rows with outlet (hostname fallback)', () => {
    mount({});
    fireEvent.click(screen.getByRole('button', { name: /This week's news/ }));
    expect(screen.getByText('Second headline')).toBeTruthy();
    expect(screen.getByText(/^People · Nov 2$/)).toBeTruthy();
    expect(screen.getByText(/^people\.com · Oct 31$/)).toBeTruthy();
  });

  it('row click calls the open handler with the item; Collapse closes', () => {
    const onOpen = vi.fn();
    mount({ onOpen });
    fireEvent.click(screen.getByRole('button', { name: /This week's news/ }));
    fireEvent.click(screen.getByRole('button', { name: /Second headline/ }));
    expect(onOpen).toHaveBeenCalledWith(items[1]);
    fireEvent.click(screen.getByRole('button', { name: /Collapse/ }));
    expect(screen.queryByText(/^people\.com/)).toBeNull();
  });

  it('is hidden under a non-All filter', () => {
    const { container } = mount({ filters: new Set<FilterId>(['Videos']) });
    expect(container.innerHTML).toBe('');
  });

  it('is hidden when empty', () => {
    const { container } = mount({ items: [] });
    expect(container.innerHTML).toBe('');
  });
});

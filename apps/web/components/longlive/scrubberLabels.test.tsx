// @vitest-environment jsdom
import { act, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TimelineScrubber } from './TimelineScrubber';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { scrubberVerticalPillTransform } from './timelineScrubberLayout';
import { AppProvider } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';

function mount() {
  const { container } = renderWithReader(
    <TestHostProvider>
      <AppProvider>
        <TimelineScrubber />
      </AppProvider>
    </TestHostProvider>,
  );
  const rail = container.querySelector<HTMLElement>('[role="slider"]')!;
  const labels = () =>
    Array.from(rail.querySelectorAll<HTMLElement>('span.uppercase')).filter((el) => el.className.includes('opacity-'));
  return { rail, labels };
}

describe('scrubber labels stay off the feed until the rail is in use', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('hides the year labels while idle', () => {
    const { labels } = mount();
    expect(labels().length).toBe(2);
    for (const el of labels()) expect(el.className).toContain('opacity-0');
  });

  it('shows them while the pointer is on the rail and keeps them briefly after release', () => {
    const { rail, labels } = mount();
    fireEvent.pointerEnter(rail);
    for (const el of labels()) expect(el.className).toContain('opacity-100');
    fireEvent.pointerLeave(rail);
    for (const el of labels()) expect(el.className).toContain('opacity-100');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    for (const el of labels()) expect(el.className).toContain('opacity-0');
  });

  it('respects reduced motion on every fading label', () => {
    const { labels } = mount();
    for (const el of labels()) expect(el.className).toContain('motion-reduce:transition-none');
  });

  it('keeps the tall idle pill inside the rail at both ends and centered mid-rail', () => {
    expect(scrubberVerticalPillTransform(0)).toBe('translateY(-0.0%)');
    expect(scrubberVerticalPillTransform(50)).toBe('translateY(-50.0%)');
    expect(scrubberVerticalPillTransform(100)).toBe('translateY(-100.0%)');
    const k = (p: number) => parseFloat(scrubberVerticalPillTransform(p).replace(/[^0-9.]/g, ''));
    for (let p = 1; p <= 100; p++) expect(k(p)).toBeGreaterThanOrEqual(k(p - 1));
  });

  it('leaves the slider semantics unchanged', () => {
    const { rail } = mount();
    expect(rail.getAttribute('aria-orientation')).toBe('vertical');
    expect(rail.getAttribute('aria-valuemin')).toBe('0');
    expect(rail.getAttribute('aria-valuemax')).toBe('100');
    expect(rail.getAttribute('aria-label')).toMatch(/timeline scrubber$/);
  });
});

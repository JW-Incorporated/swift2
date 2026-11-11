// @vitest-environment jsdom
import { act, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ERAS } from '@swift2/experience';

import { TimelineScrubber } from './TimelineScrubber';
import { WebReaderSnapshotProvider } from '@/lib/longlive/reader-snapshot-provider';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { scrubberVerticalPillTransform } from './timelineScrubberLayout';
import { AppProvider } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';

const tree = (
  <TestHostProvider>
    <AppProvider>
      <TimelineScrubber />
    </AppProvider>
  </TestHostProvider>
);

function mount() {
  const view = renderWithReader(tree);
  const rail = view.container.querySelector<HTMLElement>('[role="slider"]')!;
  const labels = () =>
    Array.from(rail.querySelectorAll<HTMLElement>('span.uppercase')).filter((el) => el.className.includes('opacity-'));
  const shown = () => labels().every((el) => el.className.includes('opacity-100'));
  const hidden = () => labels().every((el) => el.className.includes('opacity-0'));
  return { ...view, rail, labels, shown, hidden };
}

/** Give every era two measurable anchors so the rail has a position and a date, then re-measure. */
function addAnchors() {
  const els: HTMLElement[] = [];
  ERAS.forEach((era) => {
    [era.end, era.start].forEach((d, i) => {
      const el = document.createElement('div');
      el.setAttribute('data-ll-item', `${era.id}-${i}`);
      el.setAttribute('data-ll-era', era.id);
      el.setAttribute('data-ll-date', String(new Date(d).getTime()));
      el.getBoundingClientRect = () => ({ top: i * 400, bottom: i * 400 + 10, left: 0, right: 10, width: 10, height: 10, x: 0, y: i * 400, toJSON() {} });
      document.body.appendChild(el);
      els.push(el);
    });
  });
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
  return () => els.forEach((el) => el.remove());
}

const pillOf = (rail: HTMLElement) =>
  Array.from(rail.querySelectorAll<HTMLElement>('span')).find((s) => /^[A-Z][a-z]{2} \d{4}$|^Date unknown$/.test(s.textContent ?? ''));

describe('scrubber labels stay off the feed until the rail is in use', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('hides the labels while idle', () => {
    const { labels, hidden } = mount();
    expect(labels().length).toBe(2);
    expect(hidden()).toBe(true);
  });

  it('shows them while the pointer is on the rail and keeps them briefly after it leaves', () => {
    const { rail, shown, hidden } = mount();
    fireEvent.pointerEnter(rail);
    expect(shown()).toBe(true);
    fireEvent.pointerLeave(rail);
    expect(shown()).toBe(true);
    act(() => void vi.advanceTimersByTime(2000));
    expect(hidden()).toBe(true);
  });

  it('keeps them up when the pointer comes back during the linger', () => {
    const { rail, shown, hidden } = mount();
    fireEvent.pointerEnter(rail);
    fireEvent.pointerLeave(rail);
    act(() => void vi.advanceTimersByTime(900));
    fireEvent.pointerEnter(rail);
    act(() => void vi.advanceTimersByTime(3000));
    expect(shown()).toBe(true);
    fireEvent.pointerLeave(rail);
    act(() => void vi.advanceTimersByTime(1000));
    expect(shown()).toBe(true);
    act(() => void vi.advanceTimersByTime(400));
    expect(hidden()).toBe(true);
  });

  it('keyboard focus shows them; blur hides them after the linger', () => {
    const { rail, shown, hidden } = mount();
    act(() => rail.focus());
    act(() => void vi.advanceTimersByTime(5000));
    expect(shown()).toBe(true);
    fireEvent.blur(rail);
    expect(shown()).toBe(true);
    act(() => void vi.advanceTimersByTime(1500));
    expect(hidden()).toBe(true);
  });

  it('arrow keys on a pointer-focused slider still show them', () => {
    const cleanup = addAnchors();
    const { rail, shown, hidden } = mount();
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    fireEvent.pointerEnter(rail);
    fireEvent.pointerLeave(rail);
    act(() => void vi.advanceTimersByTime(3000));
    expect(hidden()).toBe(true);
    fireEvent.keyDown(rail, { key: 'ArrowDown' });
    expect(shown()).toBe(true);
    act(() => void vi.advanceTimersByTime(3000));
    expect(shown()).toBe(true);
    fireEvent.blur(rail);
    act(() => void vi.advanceTimersByTime(1500));
    expect(hidden()).toBe(true);
    cleanup();
  });

  it('a cancelled drag releases the labels', () => {
    const { rail, shown, hidden } = mount();
    rail.setPointerCapture = () => {};
    rail.releasePointerCapture = () => {};
    fireEvent.pointerDown(rail, { pointerId: 1, clientY: 10 });
    expect(shown()).toBe(true);
    fireEvent.pointerCancel(rail, { pointerId: 1, clientY: 10 });
    fireEvent.pointerLeave(rail);
    act(() => void vi.advanceTimersByTime(1500));
    expect(hidden()).toBe(true);
  });

  it('clears the linger timer on unmount', () => {
    const { rail, unmount } = mount();
    fireEvent.pointerEnter(rail);
    fireEvent.pointerLeave(rail);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('swaps the slim vertical idle pill for the wide one while the rail is in use', () => {
    const cleanup = addAnchors();
    const { rail } = mount();
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    const idle = pillOf(rail)!;
    expect(idle).toBeTruthy();
    expect(idle.className).toContain('[writing-mode:vertical-rl]');
    const idleRight = idle.style.right;
    fireEvent.pointerEnter(rail);
    const wide = pillOf(rail)!;
    expect(wide.className).not.toContain('[writing-mode:vertical-rl]');
    expect(wide.className).toContain('px-2.5');
    expect(wide.style.right).not.toBe(idleRight);
    cleanup();
  });

  it('respects reduced motion on every fading label', () => {
    const { labels } = mount();
    for (const el of labels()) expect(el.className).toContain('motion-reduce:transition-none');
  });

  it('stays hidden in the server HTML and shows once measured, so hydration cannot make it jump', () => {
    expect(renderToString(<WebReaderSnapshotProvider>{tree}</WebReaderSnapshotProvider>)).toContain('visibility:hidden');
    const { rail } = mount();
    expect((rail.closest('.fixed') as HTMLElement).style.visibility).toBe('');
  });

  it('leaves the slider semantics unchanged', () => {
    const { rail } = mount();
    expect(rail.getAttribute('aria-orientation')).toBe('vertical');
    expect(rail.getAttribute('aria-valuemin')).toBe('0');
    expect(rail.getAttribute('aria-valuemax')).toBe('100');
    expect(rail.getAttribute('aria-label')).toMatch(/timeline scrubber$/);
  });
});

describe('scrubberVerticalPillTransform', () => {
  it('keeps the pill fully inside the rail for any measured pill/rail ratio', () => {
    for (const ratio of [0.05, 0.1, 0.15, 0.2, 0.3]) {
      for (let pct = 0; pct <= 100; pct += 0.5) {
        const k = parseFloat(scrubberVerticalPillTransform(pct, ratio).replace(/[^0-9.]/g, '')) / 100;
        const top = pct - k * ratio * 100;
        expect(top).toBeGreaterThanOrEqual(-0.06);
        expect(top + ratio * 100).toBeLessThanOrEqual(100.06);
      }
    }
  });

  it('is centered mid-rail and moves monotonically', () => {
    expect(scrubberVerticalPillTransform(50, 0.2)).toBe('translateY(-50.0%)');
    let prev = -1;
    for (let p = 0; p <= 100; p++) {
      const k = parseFloat(scrubberVerticalPillTransform(p, 0.2).replace(/[^0-9.]/g, ''));
      expect(k).toBeGreaterThanOrEqual(prev);
      prev = k;
    }
  });
});

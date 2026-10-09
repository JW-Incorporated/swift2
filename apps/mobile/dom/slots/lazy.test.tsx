// @vitest-environment jsdom
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

// apps/mobile resolves its own react copy; the renderer is apps/web's, so pin hooks to the same one.
// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../../web/node_modules/react-dom'));

import { render } from '@testing-library/react';
import { lazySlot } from './lazy';

describe('lazySlot', () => {
  it('does not load at creation, loads once on first render, and renders on that same first frame', () => {
    const Real = vi.fn(({ n }: { n: number }) => createElement('i', { 'data-n': n }));
    const load = vi.fn(() => Real);
    const Slot = lazySlot(load);
    expect(load).not.toHaveBeenCalled();
    expect(Slot.isLoaded()).toBe(false);
    const { container, rerender } = render(createElement(Slot, { n: 1 }));
    expect(container.querySelector('i')?.getAttribute('data-n')).toBe('1');
    expect(load).toHaveBeenCalledTimes(1);
    rerender(createElement(Slot, { n: 2 }));
    expect(container.querySelector('i')?.getAttribute('data-n')).toBe('2');
    expect(load).toHaveBeenCalledTimes(1);
    expect(Slot.isLoaded()).toBe(true);
  });
});

describe('cold-start slot modules', () => {
  it('importing the slice modules loads none of the lazy surfaces; the era shell stays eager', async () => {
    vi.resetModules();
    const loaders = {
      loadThreadsMode: vi.fn(),
      loadCommunitySection: vi.fn(),
      loadMoodChat: vi.fn(),
      loadClownChat: vi.fn(),
    };
    vi.doMock('./lazy-loaders', () => loaders);
    const inst = await import('./instance');
    await import('./threads');
    await import('./community');
    await import('./clown');
    const s = inst.slots();
    for (const name of ['surface:threads', 'surface:community', 'surface:mood', 'surface:clownbot']) {
      expect(s[name]).toBeTypeOf('function');
    }
    for (const fn of Object.values(loaders)) expect(fn).not.toHaveBeenCalled();
  });
});

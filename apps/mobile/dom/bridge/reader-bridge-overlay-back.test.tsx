// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, useState } from 'react';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../../web/node_modules/react-dom'));

const h = vi.hoisted(() => ({ back: null as null | (() => 'handled' | 'exit'), closeItem: vi.fn(), item: null as string | null }));
vi.mock('@swift2/ui', () => ({ useReader: () => ({}) }));
vi.mock('@swift2/ui/reader/store/index', () => ({
  useAppState: () => ({ mode: 'era', openItemId: h.item }),
  useAppActions: () => ({ closeItem: h.closeItem }),
}));
vi.mock('./reader-controls', () => ({
  useReaderControls: () => ({ registerBack: (fn: typeof h.back) => (h.back = fn), slottedModes: new Set(), lastSlotted: { current: null }, setApplier: () => {} }),
}));

import { act, cleanup, render } from '@testing-library/react';
import { ReaderBridge } from './reader-bridge';
import { onboardingOverlay, resetOnboardingForTests } from '../slots/onboarding-store';
import { pushBackEntry, useBackDismiss } from '@swift2/ui/reader/lib/useBackDismiss';

// One stand-in per useBackDismiss call site (all use the identical hook contract).
const OVERLAYS = ['search', 'era selector', 'track guide', 'track detail', 'theory guide', 'crossings', 'feedback', 'thread subpanel'];
const shown = new Set<string>();
const setters = new Map<string, (v: boolean) => void>();

function Overlay({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  setters.set(name, setOpen);
  useBackDismiss(open, () => setOpen(false));
  if (open) shown.add(name);
  else shown.delete(name);
  return null;
}

const mount = (names: string[]) => render(createElement('div', null, createElement(ReaderBridge), ...names.map((n) => createElement(Overlay, { name: n, key: n }))));
const press = () => {
  let r: string = '';
  act(() => void (r = h.back!()));
  return r;
};

afterEach(async () => {
  cleanup();
  // Let the popstates from overlay UI-close history.back() land before the next test.
  await new Promise((r) => setTimeout(r, 60));
  resetOnboardingForTests();
  shown.clear();
  setters.clear();
  h.item = null;
  h.closeItem.mockClear();
});

describe('native Back closes useBackDismiss overlays', () => {
  for (const name of OVERLAYS) {
    it(`${name}: Back closes it, answers handled, then exits`, () => {
      mount([name]);
      act(() => setters.get(name)!(true));
      expect(shown.has(name)).toBe(true);
      expect(press()).toBe('handled');
      expect(shown.has(name)).toBe(false);
      expect(press()).toBe('exit');
    });
  }

  it('nested overlays close top-first', () => {
    mount(['search', 'track guide']);
    act(() => setters.get('search')!(true));
    act(() => setters.get('track guide')!(true));
    expect(press()).toBe('handled');
    expect([...shown]).toEqual(['search']);
    expect(press()).toBe('handled');
    expect(shown.size).toBe(0);
    expect(press()).toBe('exit');
  });

  it('a rapid repeat Back before the close commits never exits and closes at most one layer', () => {
    mount(['search']);
    act(() => setters.get('search')!(true));
    let a = '';
    let b = '';
    act(() => {
      a = h.back!();
      b = h.back!();
    });
    expect([a, b]).toEqual(['handled', 'handled']);
    expect(shown.size).toBe(0);
  });

  it('a navigation entry is consumed first (restore runs once), then the open item, then exit', async () => {
    h.item = 'x';
    mount([]);
    const restore = vi.fn();
    pushBackEntry(restore);
    expect(press()).toBe('handled');
    await act(async () => void (await new Promise((r) => setTimeout(r, 60))));
    expect(restore).toHaveBeenCalledTimes(1);
    expect(h.closeItem).not.toHaveBeenCalled();
    expect(press()).toBe('handled');
    expect(h.closeItem).toHaveBeenCalledTimes(1);
  });

  it('an overlay closes before the open item', () => {
    h.item = 'x';
    mount(['feedback']);
    act(() => setters.get('feedback')!(true));
    expect(press()).toBe('handled');
    expect(h.closeItem).not.toHaveBeenCalled();
    expect(press()).toBe('handled');
    expect(h.closeItem).toHaveBeenCalledTimes(1);
  });

  it('the onboarding busy guard still wins over an open overlay', () => {
    mount(['search']);
    act(() => (setters.get('search')!(true), onboardingOverlay.set('shown'), onboardingOverlay.setBusy(true)));
    expect(press()).toBe('handled');
    expect(shown.has('search')).toBe(true);
  });
});

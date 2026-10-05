// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { act, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dismissTopOverlayFromNativeBack, pushBackEntry, useBackDismiss } from '@/lib/longlive/useBackDismiss';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppActions, useAppState } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';

const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 60))));
const nativeBack = async () => {
  let r = false;
  act(() => void (r = dismissTopOverlayFromNativeBack()));
  await settle();
  return r;
};
const webBack = async () => {
  act(() => window.history.back());
  await settle();
};

let actions!: ReturnType<typeof useAppActions>;
function Probe() {
  actions = useAppActions();
  const { mode, activeEra } = useAppState();
  return <output data-testid="nav">{`${mode}|${activeEra}`}</output>;
}
const nav = () => document.querySelector('[data-testid="nav"]')!.textContent;

function Overlay({ onDismiss }: { onDismiss: () => void }) {
  const [open, setOpen] = useState(true);
  useBackDismiss(open, () => {
    onDismiss();
    setOpen(false);
  });
  return null;
}

afterEach(async () => {
  cleanup();
  await settle();
});

describe('native Back unwinds nav entries like the website Back', () => {
  it('mode and era changes are undone one native Back at a time, in order', async () => {
    renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <Probe />
        </AppProvider>
      </TestHostProvider>,
    );
    await settle();
    const start = nav();
    act(() => actions.setMode('mood'));
    const afterMode = nav();
    expect(afterMode).not.toBe(start);
    act(() => actions.setEra('lover'));
    await settle();
    const afterEra = nav();
    expect(afterEra).not.toBe(afterMode);

    expect(await nativeBack()).toBe(true);
    expect(nav()).toBe(afterMode);
    expect(await nativeBack()).toBe(true);
    expect(nav()).toBe(start);
    expect(await nativeBack()).toBe(false);
  });

  it('two nav entries restore in LIFO order, each exactly once', async () => {
    await settle();
    const a = vi.fn();
    const b = vi.fn();
    pushBackEntry(a);
    pushBackEntry(b);
    expect(await nativeBack()).toBe(true);
    expect([a.mock.calls.length, b.mock.calls.length]).toEqual([0, 1]);
    expect(await nativeBack()).toBe(true);
    expect([a.mock.calls.length, b.mock.calls.length]).toEqual([1, 1]);
    expect(await nativeBack()).toBe(false);
  });

  it('an overlay above a nav entry closes first; a rapid repeat Back is swallowed', async () => {
    await settle();
    const navDismiss = vi.fn();
    const overlayDismiss = vi.fn();
    pushBackEntry(navDismiss);
    renderWithReader(<Overlay onDismiss={overlayDismiss} />);
    expect(await nativeBack()).toBe(true);
    expect([overlayDismiss.mock.calls.length, navDismiss.mock.calls.length]).toEqual([1, 0]);
    // Rapid double Back on the nav entry: second is swallowed, restore still runs once.
    act(() => void dismissTopOverlayFromNativeBack());
    let second = false;
    act(() => void (second = dismissTopOverlayFromNativeBack()));
    await settle();
    expect(second).toBe(true);
    expect(navDismiss.mock.calls.length).toBe(1);
    expect(await nativeBack()).toBe(false);
  });

  it('web popstate path is unchanged: one browser Back restores the nav entry once', async () => {
    await settle();
    const a = vi.fn();
    pushBackEntry(a);
    await webBack();
    expect(a.mock.calls.length).toBe(1);
    expect(dismissTopOverlayFromNativeBack()).toBe(false);
  });
});

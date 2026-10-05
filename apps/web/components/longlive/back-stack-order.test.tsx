// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { THREADS } from '@swift2/experience';
import { dismissTopOverlayFromNativeBack, pushBackEntry } from '@/lib/longlive/useBackDismiss';
import { SearchOverlay } from './SearchOverlay';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppActions, useAppState } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';

const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 60))));
const llId = () => (window.history.state as { llId?: number } | null)?.llId;
// Real history traversal: jsdom fires popstate for history.back(), exactly the browser/PWA back gesture.
const webBack = async () => {
  act(() => window.history.back());
  await settle();
};

Element.prototype.scrollIntoView = () => {};

let actions!: ReturnType<typeof useAppActions>;
function Probe() {
  actions = useAppActions();
  const { mode } = useAppState();
  return <output data-testid="mode">{mode}</output>;
}

afterEach(async () => {
  cleanup();
  await settle();
});

describe('history model: nav entries and buried overlay entries', () => {
  it('search result opens a nav entry above the buried search entry; one pop restores once and skips through to base', async () => {
    renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <Probe />
          <SearchOverlay />
        </AppProvider>
      </TestHostProvider>,
    );
    await settle();
    const baseId = llId();
    const pushes = vi.spyOn(window.history, 'pushState');
    act(() => actions.setSearchOpen(true));
    const searchId = (pushes.mock.calls[0]![0] as { llId: number }).llId;
    expect(llId()).toBe(searchId);
    const thread = THREADS[0]!;
    fireEvent.change(screen.getByRole('combobox'), { target: { value: thread.title } });
    const option = (await screen.findAllByRole('option', {}, { timeout: 4000 })).find((o) => o.textContent?.includes(thread.title))!;
    fireEvent.click(option);
    await settle();
    expect(screen.getByTestId('mode').textContent).toBe('threads');
    // The nav entry sits on top; the closed search entry is buried beneath it (never back()'d in place).
    expect(pushes.mock.calls.length).toBe(2);
    expect(llId()).toBe((pushes.mock.calls[1]![0] as { llId: number }).llId);
    expect(llId()).not.toBe(searchId);

    await webBack();
    expect(screen.getByTestId('mode').textContent).toBe('era');
    expect(llId()).toBe(baseId);

    // Landed on base: a further popstate dismisses nothing.
    act(() => void window.dispatchEvent(new PopStateEvent('popstate')));
    expect(screen.getByTestId('mode').textContent).toBe('era');
    expect(dismissTopOverlayFromNativeBack()).toBe(false);
    pushes.mockRestore();
  });

  it('two nav entries and two pops restore each once and leave the stack empty', async () => {
    await settle();
    const a = vi.fn();
    const b = vi.fn();
    pushBackEntry(a);
    pushBackEntry(b);
    await webBack();
    expect([a.mock.calls.length, b.mock.calls.length]).toEqual([0, 1]);
    await webBack();
    expect([a.mock.calls.length, b.mock.calls.length]).toEqual([1, 1]);
    act(() => void window.dispatchEvent(new PopStateEvent('popstate')));
    expect([a.mock.calls.length, b.mock.calls.length]).toEqual([1, 1]);
  });
});

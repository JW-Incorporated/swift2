// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

// apps/mobile resolves its own react copy; the renderer is apps/web's, so pin hooks to the same one.
// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../../web/node_modules/react'));

const store = vi.hoisted(() => ({ setMode: vi.fn(), clearLens: vi.fn() }));
vi.mock('@swift2/ui/reader/store/index', () => ({ useAppActions: () => store, useAppState: () => ({}) }));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReaderControlsContext, type ReaderControls } from '../bridge/reader-controls';
import { ModeFallback } from './overlay-fallback';

const controls = (ok: boolean): ReaderControls => ({
  registerBack: vi.fn(),
  setApplier: vi.fn(),
  openNative: vi.fn(async () => ok),
  diag: vi.fn(),
  slottedModes: new Set(['era']),
  lastSlotted: { current: 'era' },
});
const mount = (c: ReaderControls) =>
  render(
    <ReaderControlsContext.Provider value={c}>
      <ModeFallback mode="community" />
    </ReaderControlsContext.Provider>,
  );

describe('ModeFallback', () => {
  it('a failed native handoff shows a visible placeholder with a way back, and a diag', async () => {
    store.setMode.mockClear();
    const c = controls(false);
    mount(c);
    await waitFor(() => expect(screen.getByText('Coming in the next update.')).toBeTruthy());
    expect(screen.getByText('community')).toBeTruthy();
    expect(c.diag).toHaveBeenCalledWith('fallback-native-failed', 'mode:community');
    fireEvent.click(screen.getByRole('button', { name: 'Back to eras' }));
    expect(store.setMode).toHaveBeenCalledWith('era');
  });

  it('a presented route returns to the last slotted mode and renders nothing', async () => {
    store.setMode.mockClear();
    const { container } = mount(controls(true));
    await waitFor(() => expect(store.setMode).toHaveBeenCalledWith('era'));
    expect(container.textContent).toBe('');
  });
});

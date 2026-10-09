// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { act, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ERAS } from '@swift2/experience';
import { useReader } from '@swift2/ui';
import { dismissTopOverlayFromNativeBack, resetBackStackForTests, useBackDismiss, waitForBackStackIdle } from '@/lib/longlive/useBackDismiss';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppActions, useAppState } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';

const settle = () => act(async () => void (await waitForBackStackIdle()));
const nativeBack = async () => {
  let r = false;
  act(() => void (r = dismissTopOverlayFromNativeBack()));
  await settle();
  return r;
};

let actions!: ReturnType<typeof useAppActions>;
let state!: ReturnType<typeof useAppState>;
let firstItem = '';
function Probe() {
  actions = useAppActions();
  state = useAppState();
  firstItem = useReader().contentForEra(ERAS[0]!.id)[0]?.id ?? '';
  // Stands in for the item overlay (MomentDetail): one back entry while open.
  useBackDismiss(state.openItemId !== null, actions.closeItem);
  return null;
}

const mount = async () => {
  renderWithReader(
    <TestHostProvider>
      <AppProvider>
        <Probe />
      </AppProvider>
    </TestHostProvider>,
  );
  await settle();
};
const snap = (extra: Record<string, unknown> = {}) => ({ v: 1 as const, mode: 'era', eraId: ERAS[0]!.id, scrollY: 0, ...extra });

afterEach(async () => {
  cleanup();
  await settle();
  resetBackStackForTests();
});

describe('restoreReader (#5114)', () => {
  it('restores era + open item with exactly ONE back entry (the overlay), none for the nav', async () => {
    await mount();
    expect(firstItem).not.toBe('');
    let ok = false;
    act(() => void (ok = actions.restoreReader(snap({ itemId: firstItem }))));
    await settle();
    expect(ok).toBe(true);
    expect(state.eraId).toBe(ERAS[0]!.id);
    expect(state.openItemId).toBe(firstItem);
    expect(await nativeBack()).toBe(true);
    expect(state.openItemId).toBeNull();
    expect(await nativeBack()).toBe(false);
  });

  it('a missing item lands on the era with nothing open and no back entry', async () => {
    await mount();
    act(() => void actions.restoreReader(snap({ itemId: 'gone-forever' })));
    await settle();
    expect(state.eraId).toBe(ERAS[0]!.id);
    expect(state.openItemId).toBeNull();
    expect(await nativeBack()).toBe(false);
  });

  it('an unknown mode or era goes to the front door and reports false', async () => {
    await mount();
    act(() => void actions.setEra(ERAS[0]!.id));
    await settle();
    let ok = true;
    act(() => void (ok = actions.restoreReader(snap({ eraId: 'not-an-era' }))));
    expect(ok).toBe(false);
    act(() => void (ok = actions.restoreReader(snap({ mode: 'nope' }))));
    expect(ok).toBe(false);
  });

  it('keeps the era-stream snapshot for EraStream (written after the era jump cleared it) and remounts the surface', async () => {
    await mount();
    const seq = state.restoreSeq;
    act(() => void actions.restoreReader(snap({ anchorId: ERAS[0]!.id, count: 3, scrollY: 1234 })));
    await settle();
    expect(actions.getEraScroll()).toEqual({ anchorId: ERAS[0]!.id, count: 3, scrollY: 1234 });
    expect(state.restoreSeq).toBe(seq + 1);
  });

  it('restores a non-era mode without an era snapshot', async () => {
    await mount();
    act(() => void actions.restoreReader(snap({ mode: 'mood' })));
    await settle();
    expect(state.mode).toBe('mood');
    expect(actions.getEraScroll()).toBeNull();
  });
});

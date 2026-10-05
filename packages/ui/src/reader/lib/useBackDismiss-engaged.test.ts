// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { isEngaged, setEngaged } from '../../bridge/engaged-signal';
import { pushBackEntry, resetBackStackForTests, useBackDismiss } from './useBackDismiss';

const noop = () => {};

afterEach(() => {
  resetBackStackForTests();
  for (const k of ['state', 'scroll', 'overlay-stack']) setEngaged(k, false);
});

describe('useBackDismiss reports open overlays as engaged', () => {
  it('an active hook overlay is engaged; closing it is not', () => {
    const { rerender, unmount } = renderHook(({ active }) => useBackDismiss(active, noop), { initialProps: { active: true } });
    expect(isEngaged()).toBe(true);
    rerender({ active: false });
    expect(isEngaged()).toBe(false);
    rerender({ active: true });
    expect(isEngaged()).toBe(true);
    unmount();
    expect(isEngaged()).toBe(false);
  });

  it('a nav entry alone is not engaged', () => {
    pushBackEntry(noop);
    expect(isEngaged()).toBe(false);
  });

  it('resetBackStackForTests clears it', () => {
    renderHook(() => useBackDismiss(true, noop));
    expect(isEngaged()).toBe(true);
    resetBackStackForTests();
    expect(isEngaged()).toBe(false);
  });
});

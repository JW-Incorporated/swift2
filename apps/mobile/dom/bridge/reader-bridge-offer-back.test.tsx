// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../../web/node_modules/react-dom'));

const h = vi.hoisted(() => ({ back: null as null | (() => 'handled' | 'exit'), closeItem: vi.fn() }));
vi.mock('@swift2/ui', () => ({ useReader: () => ({}) }));
vi.mock('@swift2/ui/reader/store/index', () => ({
  useAppState: () => ({ mode: 'era', openItemId: null }),
  useAppActions: () => ({ closeItem: h.closeItem }),
}));
vi.mock('./reader-controls', () => ({
  useReaderControls: () => ({ registerBack: (fn: typeof h.back) => (h.back = fn), slottedModes: new Set(), lastSlotted: { current: null }, setApplier: () => {} }),
}));

import { act, cleanup, render } from '@testing-library/react';
import { ReaderBridge } from './reader-bridge';
import { onboardingOverlay, resetOnboardingForTests } from '../slots/onboarding-store';
import { resetSettingsOverlayForTests, settingsOverlay } from '../slots/settings-store';

afterEach(() => {
  cleanup();
  resetOnboardingForTests();
  resetSettingsOverlayForTests();
});

describe('back routing with the push offer', () => {
  it('Back dismisses the offer first, then Settings, then exits', () => {
    render(createElement(ReaderBridge));
    act(() => (settingsOverlay.open(), onboardingOverlay.set('shown')));
    let r: string = '';
    act(() => void (r = h.back!()));
    expect(r).toBe('handled');
    expect(onboardingOverlay.phase()).toBe('done');
    expect(settingsOverlay.isOpen()).toBe(true);
    act(() => void (r = h.back!()));
    expect(r).toBe('handled');
    expect(settingsOverlay.isOpen()).toBe(false);
    expect(h.back!()).toBe('exit');
  });
});

// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { act, createElement as h } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HostProvider, resOk } from '@swift2/ui';
import { FeedbackButton } from '@swift2/ui/reader/legal/FeedbackButton';
// @ts-expect-error no types for the deep path; only the runtime module matters
vi.mock('react', async () => await import('../../../web/node_modules/react'));
vi.mock('@swift2/ui/reader/store/index', () => ({ useAppState: () => ({ clownChatExpanded: false }) }));
import { createAppAdapter } from '../bridge/app-adapter';
import { dismissTopOverlayFromNativeBack, resetBackStackForTests, waitForBackStackIdle } from '@swift2/ui/reader/lib/useBackDismiss';
import { currentDomUrl, setDomPath } from '../bridge/dom-path';
import { LegalOverlay } from './legal-overlay';

function mount() {
  const adapter = createAppAdapter({
    client: { call: vi.fn(async () => resOk(null)) as never },
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    isNativeRoute: () => false,
    navigateDom: (url: string) => void setDomPath(url),
    getPath: currentDomUrl,
    apiFetch: (async () => resOk(null)) as never,
    onBack: () => () => {},
  });
  render(h(HostProvider, { adapter, children: h('div', null, h(FeedbackButton), h(LegalOverlay)) }));
  return adapter;
}

afterEach(async () => {
  cleanup();
  await waitForBackStackIdle();
  resetBackStackForTests();
  window.history.replaceState(null, '');
});

const legalPage = () => document.querySelector('[data-legal-page]')?.getAttribute('data-legal-page') ?? null;

describe('a legal page opened over the (non-modal) Feedback dialog', () => {
  it('Back closes the legal page only; the next Back closes Feedback (website-equivalent order)', async () => {
    const adapter = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    expect(screen.getByRole('dialog', { name: 'Send feedback' })).toBeInTheDocument();

    act(() => adapter.navigate('/privacy'));
    expect(legalPage()).toBe('privacy');

    expect(dismissTopOverlayFromNativeBack()).toBe(true);
    await waitFor(() => expect(legalPage()).toBeNull());
    await act(async () => void (await waitForBackStackIdle()));
    expect(screen.getByRole('dialog', { name: 'Send feedback' })).toBeInTheDocument();

    expect(dismissTopOverlayFromNativeBack()).toBe(true);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Send feedback' })).toBeNull());
    await act(async () => void (await waitForBackStackIdle()));
    expect(dismissTopOverlayFromNativeBack()).toBe(false);
  });

  it('a raw history back (swipe) behaves the same: legal closes, Feedback stays', async () => {
    const adapter = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    act(() => adapter.navigate('/terms'));
    expect(legalPage()).toBe('terms');
    act(() => window.history.back());
    await waitFor(() => expect(legalPage()).toBeNull());
    await act(async () => void (await waitForBackStackIdle()));
    expect(screen.getByRole('dialog', { name: 'Send feedback' })).toBeInTheDocument();
  });
});

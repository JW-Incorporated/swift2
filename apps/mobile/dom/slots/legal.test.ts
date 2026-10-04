// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { act, createElement as h } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HostProvider, resOk } from '@swift2/ui';
import { LEGAL_FACTS } from '@swift2/ui/reader/legal/lib/legal';
// apps/mobile pins its own React; the render tests need the one @testing-library and react-dom use (apps/web's).
// @ts-expect-error no types for the deep path; only the runtime module matters
vi.mock('react', async () => await import('../../../web/node_modules/react/index.js'));
// The real button needs the reader store; its visibility is the thing under test here.
vi.mock('@swift2/ui/reader/legal/FeedbackButton', () => ({ FeedbackButton: () => h('button', null, 'Send feedback') }));
import { createAppAdapter } from '../bridge/app-adapter';
import { backFromDomPath, currentDomUrl, setDomPath } from '../bridge/dom-path';
import { createNavigateDom } from '../bridge/reader-nav';
import { createSlotRegistry } from './registry';
import { resetSlotsForTests, slots } from './instance';
import { LegalAwareFeedback, LegalOverlay } from './legal-overlay';

// The REAL app adapter (links, navigate, openExternal) over the real dom-path state; only the bridge client is a recorder.
function realAdapter() {
  const call = vi.fn(async (..._args: unknown[]) => resOk(null));
  const navigateDom = createNavigateDom({
    replaceUrl: (relative) => window.history.replaceState(null, '', relative),
    setPath: (path) => void setDomPath(path),
    applier: () => null,
    openNative: vi.fn(),
  });
  const adapter = createAppAdapter({
    client: { call: call as never },
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    isNativeRoute: () => false,
    navigateDom,
    getPath: currentDomUrl,
    apiFetch: (async () => resOk(null)) as never,
    onBack: () => () => {},
  });
  return { adapter, call };
}

function mount(children = h(LegalOverlay)) {
  const r = realAdapter();
  return { ...r, ...render(h(HostProvider, { adapter: r.adapter, children })) };
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '');
  resetSlotsForTests();
});

describe('legal slice registration', () => {
  it('registers overlay:legal and floating (the feedback button hides over a legal page)', async () => {
    const mod = await import('./legal');
    expect(Object.keys(mod.LEGAL_SLOTS).sort()).toEqual(['floating', 'overlay:legal']);
    expect(mod.LEGAL_SLOTS.floating).toBe(LegalAwareFeedback);
    const r = createSlotRegistry();
    r.register({ slice: mod.LEGAL_SLICE, slots: mod.LEGAL_SLOTS });
    r.register({ slice: mod.LEGAL_SLICE, slots: mod.LEGAL_SLOTS });
    expect(Object.keys(r.slots()).sort()).toEqual(['floating', 'overlay:legal']);
    expect(Object.keys(slots()).sort()).toEqual(['floating', 'overlay:legal']);
  });
});

describe('legal pages through the real app adapter', () => {
  it('renders nothing on the reader root', () => {
    const { container } = mount();
    expect(container).toBeEmptyDOMElement();
  });

  it('adapter.navigate opens /privacy in the DOM with the site footer; native is never asked', () => {
    const { adapter, call } = mount();
    act(() => adapter.navigate('/privacy'));
    expect(adapter.currentUrl?.()).toMatch(/\/privacy$/);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/privacy/i);
    expect(screen.getByRole('navigation', { name: 'Legal' })).toBeInTheDocument();
    expect(call).not.toHaveBeenCalled();
  });

  it('round trip: footer link to /terms, then back closes to the reader', async () => {
    const { adapter } = mount();
    act(() => adapter.navigate('/privacy'));
    fireEvent.click(screen.getByRole('link', { name: 'Terms of Use' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/terms/i);
    act(() => void backFromDomPath());
    await waitFor(() => expect(document.querySelector('[data-legal-page]')).toBeNull());
    expect(window.history.state).toBeNull();
    expect(backFromDomPath()).toBe(false);
  });

  it('support: an allow-listed mailto click reaches the bridge as openExternal (not swallowed)', () => {
    const { adapter, call } = mount();
    act(() => adapter.navigate('/support'));
    const link = screen.getByRole('link', { name: LEGAL_FACTS.privacyEmail });
    expect(fireEvent.click(link)).toBe(false);
    expect(call).toHaveBeenCalledWith('openExternal', { url: `mailto:${LEGAL_FACTS.privacyEmail}` });
  });

  it('a mailto outside the allow-list never reaches the bridge', () => {
    const { adapter, call } = mount();
    adapter.openExternal?.('mailto:someone@example.com');
    adapter.openExternal?.('mailto:privacy@longlivets.com?subject=x');
    expect(call).not.toHaveBeenCalled();
  });

  it('hides the floating feedback button while a legal page is active', () => {
    const { adapter, container } = mount(h(LegalAwareFeedback));
    expect(screen.getByRole('button', { name: 'Send feedback' })).toBeInTheDocument();
    act(() => adapter.navigate('/terms'));
    expect(container).toBeEmptyDOMElement();
  });
});

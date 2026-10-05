// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { act, createElement as h, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HostProvider, resOk } from '@swift2/ui';
import { LEGAL_FACTS } from '@swift2/ui/reader/legal/lib/legal';
// apps/mobile pins its own React; the render tests need the one @testing-library and react-dom use (apps/web's).
// @ts-expect-error no types for the deep path; only the runtime module matters
vi.mock('react', async () => await import('../../../web/node_modules/react/index.js'));
import { createAppAdapter } from '../bridge/app-adapter';
import { resetBackStackForTests } from '@swift2/ui/reader/lib/useBackDismiss';
import { backFromDomPath, currentDomPath, currentDomUrl, setDomPath } from '../bridge/dom-path';
import { showDomPath } from '../bridge/dom-path-commit';
import { applyNavigateEvent } from '../bridge/navigate-subscriber';
import { createNavigateDom } from '../bridge/reader-nav';
import { createSlotRegistry } from './registry';
import { resetSlotsForTests, slots } from './instance';
import { LegalOverlay } from './legal-overlay';

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

function mount(children: ReactNode = h(LegalOverlay)) {
  const r = realAdapter();
  return { ...r, ...render(h(HostProvider, { adapter: r.adapter, children })) };
}

afterEach(() => {
  cleanup();
  resetBackStackForTests();
  window.history.replaceState(null, '');
  resetSlotsForTests();
});

describe('legal slice registration', () => {
  it('registers only overlay:legal (the floating feedback button is the D2 slot)', async () => {
    const mod = await import('./legal');
    expect(Object.keys(mod.LEGAL_SLOTS)).toEqual(['overlay:legal']);
    const r = createSlotRegistry();
    r.register({ slice: mod.LEGAL_SLICE, slots: mod.LEGAL_SLOTS });
    r.register({ slice: mod.LEGAL_SLICE, slots: mod.LEGAL_SLOTS });
    expect(Object.keys(r.slots()).sort()).toEqual(['overlay:legal']);
    expect(Object.keys(slots()).sort()).toEqual(['overlay:legal']);
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

  it('round trip: footer link to /terms pushes, back returns to /privacy, back again closes to the reader', async () => {
    const { adapter } = mount();
    act(() => adapter.navigate('/privacy'));
    fireEvent.click(screen.getByRole('link', { name: 'Terms of Use' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/terms/i);
    act(() => void backFromDomPath());
    await waitFor(() => expect(document.querySelector('[data-legal-page]')?.getAttribute('data-legal-page')).toBe('privacy'));
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

  it('is portaled to <body> outside the themed reader shell, with no width-consuming scrollbar', () => {
    const { adapter, container } = mount(h('div', { className: 'era-shell', style: { '--era-bg': '#8b5a2b' } as never }, h(LegalOverlay)));
    act(() => adapter.navigate('/privacy'));
    const layer = document.querySelector('[data-legal-page]') as HTMLElement;
    expect(layer.parentElement).toBe(document.body);
    expect(layer.closest('.era-shell [data-legal-page]')).toBeNull();
    expect(container.contains(layer)).toBe(false);
    expect(layer.style.scrollbarWidth).toBe('none');
  });

  it('covers reader chrome (a z-71 floating button) and makes the reader inert while a legal page is active, then restores it', async () => {
    const reader = h('div', null, h('button', { 'data-testid': 'floating', className: 'z-[71]' }, 'Send feedback'), h(LegalOverlay));
    const { adapter } = mount(reader);
    const button = screen.getByTestId('floating');
    expect(button.closest('[inert]')).toBeNull();
    act(() => adapter.navigate('/terms'));
    const layer = document.querySelector('[data-legal-page]') as HTMLElement;
    expect(layer.className).toContain('z-[80]');
    expect(button.closest('[inert]')).not.toBeNull();
    expect(layer.closest('[inert]')).toBeNull();
    act(() => void backFromDomPath());
    await waitFor(() => expect(button.closest('[inert]')).toBeNull());
  });

  it('a legal page opens scrolled to the top, also when reached from a scrolled footer', () => {
    const { adapter } = mount();
    act(() => adapter.navigate('/privacy'));
    const first = document.querySelector('[data-legal-page]') as HTMLElement;
    first.scrollTop = 900;
    expect(first.scrollTop).toBe(900);
    fireEvent.click(screen.getByRole('link', { name: 'Terms of Use' }));
    const second = document.querySelector('[data-legal-page="terms"]') as HTMLElement;
    expect(second).not.toBe(first);
    expect(second.scrollTop).toBe(0);
  });
});

describe('native-to-DOM navigate to a legal path (real subscriber + rendered overlay)', () => {
  it('acks ok only once the legal layer has committed', async () => {
    const { adapter } = mount();
    const deps = { replaceUrl: vi.fn(), apply: vi.fn(async () => true), setPath: showDomPath };
    expect(await applyNavigateEvent({ path: '/support' as never }, deps)).toBe(true);
    expect(document.querySelector('[data-legal-page="support"]')).not.toBeNull();
    expect(adapter.currentUrl?.()).toMatch(/\/support$/);
    expect(await applyNavigateEvent({ path: '/?item=a' as never }, deps)).toBe(true);
    expect(document.querySelector('[data-legal-page]')).toBeNull();
    expect(deps.apply).toHaveBeenCalledWith('?item=a');
  });

  it('answers false and restores the previous path when no legal layer is mounted', async () => {
    const deps = { replaceUrl: vi.fn(), apply: vi.fn(async () => true), setPath: showDomPath };
    expect(await applyNavigateEvent({ path: '/privacy' as never }, deps)).toBe(false);
    expect(currentDomPath()).toBe('/');
  });

  it('a failed legal-to-legal commit pops its pushed entry: no duplicate entry, one Back reaches the reader', async () => {
    const deps = { replaceUrl: vi.fn(), apply: vi.fn(async () => true), setPath: showDomPath };
    window.history.pushState({ swift2Path: '/privacy' }, '');
    expect(currentDomPath()).toBe('/privacy');
    expect(await applyNavigateEvent({ path: '/terms' as never }, deps)).toBe(false);
    expect(currentDomPath()).toBe('/privacy');
    expect(window.history.state).toMatchObject({ swift2Path: '/privacy' });
    window.history.back();
    await new Promise((r) => window.addEventListener('popstate', () => r(null), { once: true }));
    expect(currentDomPath()).toBe('/');
  });
});

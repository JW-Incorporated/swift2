// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HostProvider, type HostAdapter } from '@swift2/ui';
import { FeedbackButton } from '@swift2/ui/reader/legal/FeedbackButton';
import { LEGAL_FACTS } from '@swift2/ui/reader/legal/lib/legal';
// apps/mobile pins its own React; the render tests need the one @testing-library and react-dom use (apps/web's).
// @ts-expect-error no types for the deep path; only the runtime module matters
vi.mock('react', async () => await import('../../../web/node_modules/react/index.js'));
import { createSlotRegistry } from './registry';
import { resetSlotsForTests, slots } from './instance';
import { LegalOverlay } from './legal-overlay';

function adapter(path: string, extra: Partial<HostAdapter> = {}): HostAdapter {
  return {
    Link: (props: Record<string, unknown>) => h('a', props),
    navigate: () => {},
    onBack: () => () => {},
    currentUrl: () => `https://www.longlivets.com${path}`,
    ...extra,
  } as unknown as HostAdapter;
}

function mount(path: string, extra: Partial<HostAdapter> = {}) {
  return render(h(HostProvider, { adapter: adapter(path, extra), children: h(LegalOverlay) }));
}

describe('legal slice registration', () => {
  beforeEach(() => resetSlotsForTests());

  it('registers overlay:legal and floating (no footer: SiteFooter is shell chrome)', async () => {
    const mod = await import('./legal');
    expect(Object.keys(mod.LEGAL_SLOTS).sort()).toEqual(['floating', 'overlay:legal']);
    expect(mod.LEGAL_SLOTS.floating).toBe(FeedbackButton);
    const r = createSlotRegistry();
    r.register({ slice: mod.LEGAL_SLICE, slots: mod.LEGAL_SLOTS });
    r.register({ slice: mod.LEGAL_SLICE, slots: mod.LEGAL_SLOTS });
    expect(Object.keys(r.slots()).sort()).toEqual(['floating', 'overlay:legal']);
    expect(Object.keys(slots()).sort()).toEqual(['floating', 'overlay:legal']);
  });
});

describe('LegalOverlay', () => {
  afterEach(cleanup);

  it('renders nothing off a legal path', () => {
    const { container } = mount('/?mode=merch');
    expect(container).toBeEmptyDOMElement();
  });

  it('renders privacy and terms documents', () => {
    mount('/privacy');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/privacy/i);
    cleanup();
    mount('/terms');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/terms/i);
  });

  it('renders support; allow-listed mailto goes through openExternal, with no navigation', () => {
    const openExternal = vi.fn();
    mount('/support', { openExternal });
    const link = screen.getByRole('link', { name: LEGAL_FACTS.privacyEmail });
    expect(fireEvent.click(link)).toBe(false);
    expect(openExternal).toHaveBeenCalledWith(`mailto:${LEGAL_FACTS.privacyEmail}`);
  });

  it('reacts to popstate', () => {
    let path = '/';
    render(
      h(HostProvider, {
        adapter: { ...adapter('/'), currentUrl: () => `https://x.test${path}` },
        children: h(LegalOverlay),
      }),
    );
    expect(document.querySelector('[data-legal-page]')).toBeNull();
    path = '/privacy';
    fireEvent(window, new PopStateEvent('popstate'));
    expect(document.querySelector('[data-legal-page="privacy"]')).not.toBeNull();
  });
});

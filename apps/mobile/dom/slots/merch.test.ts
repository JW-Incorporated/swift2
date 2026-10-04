import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { HostAdapter } from '@swift2/ui';

// packages/ui components render with the root react; the form test resolves its renderer from there (apps/mobile pins another copy).
const uiRequire = createRequire(new URL('../../../../packages/ui/package.json', import.meta.url));
const { createElement: uiCreateElement } = uiRequire('react') as typeof import('react');
const { renderToStaticMarkup: uiRender } = uiRequire('react-dom/server') as typeof import('react-dom/server');

const seen: { extensions?: unknown } = {};
const domains = { merch: { shopTheLook: [], officialStore: [], fanMade: [] }, songMoods: [] };

vi.mock('@swift2/ui', async (orig) => ({
  ...(await orig<typeof import('@swift2/ui')>()),
  useExtendedSnapshot: () => ({ domains }),
}));
vi.mock('@swift2/ui/reader/merch/MerchSection', () => ({
  MerchSection: (p: { extensions: unknown }) => {
    seen.extensions = p.extensions;
    return null;
  },
}));

import { HostProvider } from '@swift2/ui';
import { SubmitLinkForm } from '@swift2/ui/reader/merch/SubmitLinkForm';
import { createSlotRegistry } from './registry';
import { MERCH_SLICE, MERCH_SLOTS, MerchSurface } from './merch';

describe('merch slice', () => {
  it('registers only surface:merch, idempotently', () => {
    expect(Object.keys(MERCH_SLOTS)).toEqual(['surface:merch']);
    const r = createSlotRegistry();
    r.register({ slice: MERCH_SLICE, slots: MERCH_SLOTS });
    r.register({ slice: MERCH_SLICE, slots: MERCH_SLOTS });
    expect(r.slots()['surface:merch']).toBe(MerchSurface);
  });

  it('passes the snapshot merch and songMoods domains as the extensions', () => {
    renderToStaticMarkup(createElement(MerchSurface));
    expect(seen.extensions).toEqual({ merch: domains.merch, songMoods: domains.songMoods });
  });

  it('with env.turnstileSiteKey null the submit-link form renders, with no verification message', () => {
    const adapter = { apiFetch: vi.fn(), env: { turnstileSiteKey: null } } as unknown as HostAdapter;
    const html = uiRender(
      uiCreateElement(HostProvider, { adapter }, uiCreateElement(SubmitLinkForm, { section: 'merch' })),
    );
    expect(html).toContain('<form');
    expect(html).toContain('type="submit"');
    expect(html.toLowerCase()).not.toContain('verif');
    expect(html.toLowerCase()).not.toContain('turnstile');
  });
});

// @vitest-environment jsdom
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// apps/mobile resolves its own react copy; the renderer is apps/web's, so pin hooks to the same one.
// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../../web/node_modules/react'));

const seen: { extensions?: unknown } = {};
const domains = { merch: { shopTheLook: [], officialStore: [], fanMade: [] }, songMoods: [], lore: [] };

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

import { fireEvent, render, waitFor } from '@testing-library/react';
import { HostProvider, type HostAdapter } from '@swift2/ui';
import { createHostShopLinkRenderer } from '@swift2/ui/reader/moment/lib/shop';
import { SubmitLinkForm } from '@swift2/ui/reader/merch/SubmitLinkForm';
import { createAppAdapter } from '../bridge/app-adapter';
import { resetSlotsForTests } from './instance';
import { MERCH_SLICE, MERCH_SLOTS, MerchSurface } from './merch';

afterEach(() => resetSlotsForTests());

describe('merch slice', () => {
  it('self-registers only surface:merch into the global registry on import', async () => {
    vi.resetModules();
    const inst = await import('./instance');
    expect(Object.keys(inst.slots())).toEqual([]);
    const mod = await import('./merch');
    expect(Object.keys(inst.slots())).toEqual(['surface:merch']);
    expect(inst.slots()['surface:merch']).toBe(mod.MerchSurface);
    expect(mod.MERCH_SLICE).toBe(MERCH_SLICE);
    expect(Object.keys(MERCH_SLOTS)).toEqual(['surface:merch']);
  });

  it('passes the snapshot merch and songMoods domains (and lore) as the extensions', () => {
    render(createElement(MerchSurface));
    expect(seen.extensions).toEqual({ merch: domains.merch, songMoods: domains.songMoods, lore: domains.lore });
  });
});

describe('merch submit-link through the host', () => {
  it('with env.turnstileSiteKey null the form has no verification text and submitting calls host.apiFetch', async () => {
    const apiFetch = vi.fn(async () => ({ status: 200, body: '{}' }));
    const adapter = { apiFetch, env: { turnstileSiteKey: null } } as unknown as HostAdapter;
    const { container } = render(
      createElement(HostProvider, { adapter }, createElement(SubmitLinkForm, { section: 'merch' })),
    );
    expect(container.textContent?.toLowerCase()).not.toMatch(/verif|turnstile/);

    fireEvent.change(container.querySelector('input[type="url"]')!, { target: { value: 'https://shop.example.com/x' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1));
    const req = (apiFetch.mock.calls[0] as unknown as [{ path: string; method: string; body: string }])[0];
    expect(req.path).toBe('/api/submit-link');
    expect(req.method).toBe('POST');
    expect(JSON.parse(req.body)).toMatchObject({ url: 'https://shop.example.com/x', section: 'merch', token: '' });
  });
});

describe('merch links under the real app adapter (G4: no affiliate)', () => {
  const appAdapter = createAppAdapter({
    client: { call: vi.fn() } as never,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    isNativeRoute: () => false,
    navigateDom: vi.fn(),
    getPath: () => '/',
    apiFetch: vi.fn() as never,
    onBack: () => () => {},
  });

  it('supplies no affiliate env, so the renderer MerchCard builds returns plain retailer URLs', () => {
    expect(appAdapter.env.affiliate).toBeUndefined();
    const renderer = createHostShopLinkRenderer(appAdapter.env.affiliate ?? {});
    for (const [retailer, url] of [
      ['amazon.com', 'https://www.amazon.com/dp/B0TEST?th=1'],
      ['ralphlauren.com', 'https://www.ralphlauren.com/p/shirt-1'],
    ] as const) {
      const out = renderer.forMerch({ retailer, url }, 'official');
      expect(out).toEqual({ href: url, isAffiliate: false });
    }
  });
});

import { createHostShopLinkRenderer } from '@swift2/ui/reader/moment/lib/shop';
import { MomentDetail } from '@swift2/ui/reader/moment/MomentDetail';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { register, slots } from './instance';
import './moment';

describe('moment slice slots', () => {
  it('registers MomentDetail (from the package) as overlay:moment, and nothing else', () => {
    expect(Object.keys(slots())).toEqual(['overlay:moment']);
    expect(slots()['overlay:moment']).toBe(MomentDetail);
  });

  it('is idempotent for the same slice (Fast Refresh) and rejects a duplicate name', () => {
    register({ slice: 'moment', slots: { 'overlay:moment': MomentDetail } });
    expect(() => register({ slice: 'other', slots: { 'overlay:moment': () => null } })).toThrow(/duplicate slot/);
  });

  it('imports no apps/web shim (G10)', () => {
    const src = readFileSync(fileURLToPath(new URL('./moment.ts', import.meta.url)), 'utf8');
    expect(src).not.toMatch(/web\/components\/longlive|spike\/reader-modules/);
  });
});

describe('moment shop links under the app env (G4: no affiliate)', () => {
  // The app adapter leaves HostEnv.affiliate ABSENT; ShopTheLook does `createHostShopLinkRenderer(affiliate ?? {})`.
  const renderer = createHostShopLinkRenderer({});
  const ctx = { eraId: 'tloas', momentId: 'm1' };

  it.each([
    ['Amazon', 'https://www.amazon.com/dp/B0TEST?th=1'],
    ['Ralph Lauren', 'https://www.ralphlauren.com/p/shirt-1'],
    ['Etsy', 'https://www.etsy.com/listing/1/thing'],
  ])('%s href is the plain retailer URL with no tag params', (retailer, url) => {
    const out = renderer.forMoment({ retailer, url }, ctx);
    expect(out.href).toBe(url);
    expect(out.isAffiliate).toBe(false);
    expect(out.href).not.toMatch(/tag=|ascsubtag|awin|clickref/);
  });
});

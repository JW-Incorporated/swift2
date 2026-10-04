import { describe, expect, it } from 'vitest';
import { createWebAdapter } from '../../../web/lib/host-adapter';
import { createSpikeAdapter } from './reader-modules';

describe('createSpikeAdapter (DOM host adapter)', () => {
  it('sets embedOrigin to the canonical origin so YouTube embeds frame the wrapper page (#4954)', () => {
    const base = createWebAdapter({ push() {}, replace() {} });
    const adapter = createSpikeAdapter(base);
    expect(adapter.embedOrigin).toBe(base.env.origin);
    expect(adapter.embedOrigin).toBe('https://www.longlivets.com');
    expect(adapter.resolveUrl('/eras/x.png')).toBe(`${base.env.origin}/eras/x.png`);
  });

  it('the web adapter itself has no embedOrigin', () => {
    expect(createWebAdapter({ push() {}, replace() {} }).embedOrigin).toBeUndefined();
  });
});

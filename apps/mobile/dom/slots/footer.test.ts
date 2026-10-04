import { describe, expect, it } from 'vitest';
import { SiteFooter } from '@swift2/ui/reader/legal/SiteFooter';
import { buildReaderSlots } from './reader-slots';

describe('footer slot (SiteFooter)', () => {
  it('registers the package SiteFooter as `footer` and the mapper hands it to ReaderSlots.footer', async () => {
    const { slots } = await import('./index');
    expect(slots().footer).toBe(SiteFooter);
    const s = buildReaderSlots(slots(), { overlays: [], fallback: (() => null) as never });
    expect(s.footer).toBe(SiteFooter);
  });
});

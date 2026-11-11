import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostProvider } from '@swift2/ui';
import { ShopTheLook } from '@swift2/ui/reader/moment/ShopTheLook';
import { createWebRootAdapter } from '@/lib/host-adapter';

vi.mock('lucide-react', () => ({
  ExternalLink: () => createElement('svg', { 'aria-hidden': 'true' }),
  ShoppingBag: () => createElement('svg', { 'aria-hidden': 'true' }),
}));

const STATEMENT = 'As an Amazon Associate I earn from qualifying purchases.';
const context = { eraId: 'midnights', momentId: 'm1' };
const amazon = { brand: 'B', item: 'Amazon thing', retailer: 'amazon.com', url: 'https://www.amazon.com/dp/B0' };
const other = { brand: 'E', item: 'Etro thing', retailer: 'etro.com', url: 'https://www.etro.com/p/1' };

function render(products: (typeof amazon)[]) {
  const adapter = createWebRootAdapter({ push() {}, replace() {} });
  return renderToStaticMarkup(
    createElement(HostProvider, { adapter }, createElement(ShopTheLook, { products, context })),
  );
}

afterEach(() => vi.unstubAllEnvs());

describe('ShopTheLook Amazon disclosure', () => {
  it('shows the statement before the list when an Amazon affiliate product renders', () => {
    vi.stubEnv('NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG', 'longlive-20');
    const html = render([other, amazon]);
    expect(html).toContain(STATEMENT);
    expect(html.indexOf(STATEMENT)).toBeLessThan(html.indexOf('<ul'));
  });

  it('omits it without an Amazon affiliate product, or with an untagged Amazon one', () => {
    vi.stubEnv('NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG', 'longlive-20');
    expect(render([other])).not.toContain('Amazon Associate');
    vi.stubEnv('NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG', '');
    expect(render([amazon])).not.toContain('Amazon Associate');
  });
});

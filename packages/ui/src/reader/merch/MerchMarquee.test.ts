import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MerchMarquee } from './MerchMarquee';

describe('MerchMarquee', () => {
  it('renders no <style> element (the CSP blocks un-nonced inline styles)', () => {
    const html = renderToStaticMarkup(
      createElement(MerchMarquee, { eyebrow: 'e', title: 't', lede: 'l', bulbCount: 3 }),
    );
    expect(html).not.toMatch(/<style/i);
    expect(html).toContain('merch-marquee-bulb');
  });
});

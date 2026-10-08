import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RunwaySources } from './RunwaySources';

describe('RunwaySources', () => {
  it('renders external links when sources are present', () => {
    const html = renderToStaticMarkup(
      createElement(RunwaySources, { sources: [{ title: 'Vogue', url: 'https://www.vogue.com/x' }] }),
    );
    expect(html).toContain('Sources');
    expect(html).toContain('href="https://www.vogue.com/x"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('>Vogue<');
  });
  it('renders nothing when absent or empty', () => {
    expect(renderToStaticMarkup(createElement(RunwaySources, {}))).toBe('');
    expect(renderToStaticMarkup(createElement(RunwaySources, { sources: [] }))).toBe('');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AppReader from './AppReader';

vi.mock('./reader-spike.css', () => ({}));

describe('AppReader cold-start placeholder', () => {
  it('first render shows no text and sits on the site background var', () => {
    const noop = async () => {};
    const props = { dom: {}, onReady: noop, reportError: noop, reportProbe: noop, reportImageLoad: noop, speedTestOn: false };
    const html = renderToStaticMarkup(<AppReader {...(props as unknown as Parameters<typeof AppReader>[0])} />);
    expect(html.replace(/<[^>]*>/g, '')).toBe('');
    expect(html).not.toMatch(/Loading/i);
    expect(html).toContain('data-swift2-ui');
    expect(html).toContain('background:var(--era-bg)');
  });
});

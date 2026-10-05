import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appCss = readFileSync(new URL('./reader-spike.css', import.meta.url), 'utf8');
const webCss = readFileSync(new URL('../../web/app/globals.css', import.meta.url), 'utf8');

describe('W6 webview CSS parity with longlivets.com', () => {
  it.each([
    '-webkit-text-size-adjust',
    'text-size-adjust',
    '-webkit-tap-highlight-color',
    '-webkit-touch-callout',
    'user-select',
    '-webkit-font-smoothing',
    'scroll-behavior',
    'overflow-anchor',
    'outline',
    'touch-action',
  ])('app CSS does not override %s (the engine default matches Safari/Chrome)', (prop) => {
    expect(appCss).not.toMatch(new RegExp(`(?<![\\w-])${prop}\\s*:`));
  });

  it('the only deliberate app-only document override is overscroll-behavior', () => {
    expect(appCss).toContain('overscroll-behavior: none');
  });

  it('font smoothing and color-scheme come from the shared web stylesheet', () => {
    expect(appCss).toContain("@import '../../web/app/globals.css'");
    expect(webCss).toContain('-webkit-font-smoothing: antialiased');
    expect(webCss).toContain('color-scheme: dark');
  });
});

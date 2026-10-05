import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AppImage } from './app-adapter';
import { responsiveAttrs } from './responsive-image';

const O = 'https://www.longlivets.com';
const u = (p: string, w: number) => `${O}/_next/image?url=${encodeURIComponent(p)}&w=${w}&q=75`;

describe('responsiveAttrs (mirrors next/image)', () => {
  it('fill without sizes: device widths, 100vw, largest as src', () => {
    const a = responsiveAttrs({ src: `${O}/eras/red.png`, origin: O, fill: true })!;
    expect(a.srcSet.split(', ')).toHaveLength(8);
    expect(a.srcSet).toContain(`${u('/eras/red.png', 640)} 640w`);
    expect(a.srcSet).toContain(`${u('/eras/red.png', 3840)} 3840w`);
    expect(a.src).toBe(u('/eras/red.png', 3840));
    expect(a.sizes).toBe('100vw');
  });
  it('vw sizes filter small widths and pass sizes through', () => {
    const a = responsiveAttrs({ src: '/eras/red.png', origin: O, fill: true, sizes: '(min-width: 1024px) 50vw, 100vw' })!;
    expect(a.srcSet.startsWith(`${u('/eras/red.png', 384)} 384w`)).toBe(true);
    expect(a.srcSet).toContain(' 640w');
    expect(a.srcSet).not.toContain(' 128w');
    expect(a.sizes).toBe('(min-width: 1024px) 50vw, 100vw');
  });
  it('fixed width: 1x/2x with nearest configured widths and no sizes', () => {
    const a = responsiveAttrs({ src: '/eras/red.png', origin: O, width: 100 })!;
    expect(a.srcSet).toBe(`${u('/eras/red.png', 128)} 1x, ${u('/eras/red.png', 256)} 2x`);
    expect(a.sizes).toBeUndefined();
  });
  it('leaves svg, gif, third-party, query and unoptimized srcs alone', () => {
    for (const src of ['/a.svg', '/a.gif', 'https://i.ytimg.com/a.jpg', '/a.png?x=1', '//cdn/a.png'])
      expect(responsiveAttrs({ src, origin: O, fill: true })).toBeNull();
    expect(responsiveAttrs({ src: '/a.png', origin: O, fill: true, unoptimized: true })).toBeNull();
  });
});

describe('AppImage responsive output', () => {
  it('emits srcset/sizes and keeps lazy/async', () => {
    const html = renderToStaticMarkup(createElement(AppImage, { src: `${O}/eras/red.png`, alt: '', fill: true, sizes: '50vw' }));
    expect(html).toContain('srcSet=');
    expect(html).toContain('sizes="50vw"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
  });
  it('priority stays eager/high', () => {
    const html = renderToStaticMarkup(createElement(AppImage, { src: `${O}/eras/red.png`, alt: '', priority: true, width: 10, height: 10 }));
    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchPriority="high"');
  });
  it('non-optimizable src has no srcset', () => {
    const html = renderToStaticMarkup(createElement(AppImage, { src: '/a.svg', alt: '', width: 1, height: 1 }));
    expect(html).not.toContain('srcSet');
    expect(html).toContain('src="/a.svg"');
  });
});

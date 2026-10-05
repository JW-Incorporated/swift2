// @vitest-environment jsdom
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../../web/node_modules/react-dom'));

import { fireEvent, render } from '@testing-library/react';
import { AppImage } from './app-adapter';
import { artStats, loadArtMap, resetArtMapForTests } from '../reader/art-map';

const A = '/eras/a.png';
const FILE = 'file:///art/a.png';
const img = (src: string) => createElement(AppImage, { src, alt: 'x', fill: true });

async function withMap(map: Record<string, string>) {
  (globalThis as unknown as Record<string, unknown>).__swift2ArtMap = map;
  const el: Record<string, unknown> = { remove: () => {} };
  const doc = {
    createElement: () => el,
    head: { appendChild: () => queueMicrotask(() => (el.onload as () => void)()) },
  } as unknown as Document;
  await loadArtMap('file:///art/art-map.js', doc);
}

beforeEach(() => resetArtMapForTests());

describe('AppImage offline art', () => {
  it('map hit: serves the file:// src directly with no srcSet, counts the load', async () => {
    await withMap({ 'https://www.longlivets.com/eras/a.png': FILE });
    const { container } = render(img(A));
    const el = container.querySelector('img')!;
    expect(el.getAttribute('src')).toBe(FILE);
    expect(el.getAttribute('srcset')).toBeNull();
    fireEvent.load(el);
    expect(artStats()).toMatchObject({ loaded: 1, fallback: 0 });
  });

  it('map miss: the responsive remote path, as today', async () => {
    await withMap({ 'https://www.longlivets.com/eras/other.png': FILE });
    const el = render(img(A)).container.querySelector('img')!;
    expect(el.getAttribute('srcset')).toContain('/_next/image');
    expect(el.getAttribute('src')).not.toContain('file:');
  });

  it('no map at all: unchanged', () => {
    const el = render(img(A)).container.querySelector('img')!;
    expect(el.getAttribute('srcset')).toContain('/_next/image');
  });

  it('onError on the file:// src falls back to the remote url and counts it', async () => {
    await withMap({ 'https://www.longlivets.com/eras/a.png': FILE });
    const { container } = render(img(A));
    const el = () => container.querySelector('img')!;
    fireEvent.error(el());
    expect(el().getAttribute('src')).not.toContain('file:');
    expect(el().getAttribute('srcset')).toContain('/_next/image');
    expect(artStats()).toMatchObject({ fallback: 1 });
  });
});

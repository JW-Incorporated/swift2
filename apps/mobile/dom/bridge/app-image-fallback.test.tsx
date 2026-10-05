// @vitest-environment jsdom
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

// apps/mobile resolves its own react copy; the renderer is apps/web's, so pin hooks to the same one.
// @ts-expect-error -- untyped deep path on purpose (no declaration file for the copy)
vi.mock('react', async () => await import('../../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../../web/node_modules/react-dom'));

import { fireEvent, render } from '@testing-library/react';
import { AppImage } from './app-adapter';

const A = 'https://www.longlivets.com/eras/a.png';
const B = 'https://www.longlivets.com/eras/b.png';
const img = (src: string) => createElement(AppImage, { src, alt: 'x', fill: true });

describe('AppImage error fallback', () => {
  it('falls back to the original on error, and uses srcset again after src changes', () => {
    const { container, rerender } = render(img(A));
    const el = () => container.querySelector('img')!;
    expect(el().getAttribute('srcset')).toContain('/_next/image');
    fireEvent.error(el());
    expect(el().getAttribute('srcset')).toBeNull();
    expect(el().getAttribute('src')).toBe(A);
    rerender(img(B));
    expect(el().getAttribute('srcset')).toContain(encodeURIComponent('/eras/b.png'));
  });
});

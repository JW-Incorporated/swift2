import { afterEach, describe, expect, it, vi } from 'vitest';
import { imageLoaded, setImageLoadListener } from './image-listener';

const el = (rect: Partial<DOMRect>) =>
  ({
    getBoundingClientRect: () => ({ width: 100, height: 100, top: 0, bottom: 100, ...rect }),
  }) as HTMLImageElement;

describe('image load listener', () => {
  afterEach(() => {
    setImageLoadListener(null);
    vi.unstubAllGlobals();
  });

  it('reports visibility against the viewport and is silent without a listener', () => {
    vi.stubGlobal('window', { innerHeight: 800 });
    imageLoaded(el({}));
    const seen: boolean[] = [];
    setImageLoadListener((v) => seen.push(v));
    imageLoaded(el({}));
    imageLoaded(el({ top: 900, bottom: 1000 }));
    imageLoaded(el({ top: -300, bottom: -10 }));
    imageLoaded(el({ width: 0 }));
    expect(seen).toEqual([true, false, false, false]);
  });
});

// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { SyntheticEvent } from 'react';
import { ERA_IMAGE_PLACEHOLDER_STYLE, hideFailedImage } from './image-fallback';

describe('moment card image fallback (#6807)', () => {
  it('hides only the failed image, leaving its box in place', () => {
    const box = document.createElement('div');
    const img = document.createElement('img');
    box.appendChild(img);
    hideFailedImage({ currentTarget: img } as unknown as SyntheticEvent<HTMLImageElement>);
    expect(img.style.visibility).toBe('hidden');
    expect(img.parentElement).toBe(box);
  });

  it('tints the placeholder from the active era palette', () => {
    const bg = String(ERA_IMAGE_PLACEHOLDER_STYLE.background);
    expect(bg).toContain('var(--era-accent)');
    expect(bg).toContain('var(--era-surface)');
  });
});

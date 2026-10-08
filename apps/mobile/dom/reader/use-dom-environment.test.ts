// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { applyDocumentA11y, applyFontScale, clampFontScale } from './use-dom-environment';

const EXPO_VIEWPORT = 'width=device-width, initial-scale=1, user-scalable=no';

function setHead(content: string | null) {
  document.documentElement.removeAttribute('lang');
  document.head.innerHTML = content === null ? '' : `<meta name="viewport" content="${content}">`;
}

describe('applyDocumentA11y', () => {
  beforeEach(() => setHead(EXPO_VIEWPORT));

  it('sets lang="en" when unset and keeps an existing lang', () => {
    applyDocumentA11y(document);
    expect(document.documentElement.lang).toBe('en');
    document.documentElement.lang = 'fr';
    applyDocumentA11y(document);
    expect(document.documentElement.lang).toBe('fr');
  });

  it('removes user-scalable=no from the Expo viewport, keeping the rest', () => {
    applyDocumentA11y(document);
    expect(document.querySelector('meta[name="viewport"]')!.getAttribute('content')).toBe('width=device-width, initial-scale=1');
  });

  it('drops maximum-scale=1 too, and leaves a zoomable viewport alone', () => {
    setHead('width=device-width, initial-scale=1, maximum-scale=1');
    applyDocumentA11y(document);
    expect(document.querySelector('meta[name="viewport"]')!.getAttribute('content')).toBe('width=device-width, initial-scale=1');
    setHead('width=device-width, initial-scale=1, maximum-scale=5');
    applyDocumentA11y(document);
    expect(document.querySelector('meta[name="viewport"]')!.getAttribute('content')).toBe('width=device-width, initial-scale=1, maximum-scale=5');
  });

  it('tolerates a page with no viewport meta', () => {
    setHead(null);
    expect(() => applyDocumentA11y(document)).not.toThrow();
    expect(document.documentElement.lang).toBe('en');
  });
});

describe('applyFontScale', () => {
  const root = () => document.documentElement;

  it('shrinks the root font-size and sets --font-scale', () => {
    applyFontScale(document, 0.9);
    expect(root().style.fontSize).toBe('90%');
    expect(root().style.getPropertyValue('--font-scale')).toBe('0.9');
  });

  it('clamps to [0.85, 1.5] and falls back to 1 for junk', () => {
    expect(clampFontScale(0.5)).toBe(0.85);
    expect(clampFontScale(3.5)).toBe(1.5);
    expect(clampFontScale(1.3)).toBe(1.3);
    expect(clampFontScale(Number.NaN)).toBe(1);
    expect(clampFontScale(undefined)).toBe(1);
    applyFontScale(document, 0.1);
    expect(root().style.fontSize).toBe('85%');
  });

  it('is a no-op at 1 and removes a previously set value', () => {
    applyFontScale(document, 0.9);
    applyFontScale(document, 1);
    expect(root().style.fontSize).toBe('');
    expect(root().style.getPropertyValue('--font-scale')).toBe('');
    applyFontScale(document, 1);
    expect(root().style.fontSize).toBe('');
  });

  it('enlarges the root font-size up to the cap', () => {
    applyFontScale(document, 1.3);
    expect(root().style.fontSize).toBe('130%');
    applyFontScale(document, 3);
    expect(root().style.fontSize).toBe('150%');
  });

  it('updates when the scale changes', () => {
    applyFontScale(document, 0.9);
    applyFontScale(document, 0.95);
    expect(root().style.fontSize).toBe('95%');
  });
});

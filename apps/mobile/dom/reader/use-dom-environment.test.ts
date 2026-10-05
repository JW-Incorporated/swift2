// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { applyDocumentA11y } from './use-dom-environment';

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

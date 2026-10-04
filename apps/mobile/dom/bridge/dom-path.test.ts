// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { backFromDomPath, currentDomPath, currentDomUrl, DOM_PATH_EVENT, isDomPath, setDomPath, subscribeDomPath } from './dom-path';

afterEach(() => window.history.replaceState(null, '', '/'));

describe('dom-path', () => {
  it('allow-lists exactly /privacy, /terms, /support', () => {
    expect(['/privacy', '/terms', '/support'].every(isDomPath)).toBe(true);
    for (const p of ['/', '/settings', '/privacy/', '/privacy?x=1', '//privacy', '/Privacy', '']) expect(isDomPath(p)).toBe(false);
  });

  it('reports the real in-DOM path with the page query and hash', () => {
    window.history.replaceState(null, '', '/?item=a#h');
    expect(currentDomUrl()).toBe('/?item=a#h');
    expect(setDomPath('/privacy')).toBe(true);
    expect(currentDomUrl()).toBe('/privacy?item=a#h');
  });

  it('refuses a path outside the allow-list without touching history', () => {
    const len = window.history.length;
    expect(setDomPath('/settings')).toBe(false);
    expect(currentDomPath()).toBe('/');
    expect(window.history.length).toBe(len);
  });

  it('first legal page pushes, legal-to-legal and back-to-root replace, and every change notifies', () => {
    const len = window.history.length;
    const cb = vi.fn();
    const off = subscribeDomPath(cb);
    setDomPath('/privacy');
    expect(window.history.length).toBe(len + 1);
    setDomPath('/terms');
    expect(window.history.length).toBe(len + 1);
    setDomPath('/terms');
    setDomPath('/');
    expect(window.history.length).toBe(len + 1);
    expect(cb).toHaveBeenCalledTimes(3);
    off();
    setDomPath('/support');
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it('a popstate (history back) returns to the previous reader state', async () => {
    setDomPath('/support');
    const popped = new Promise<void>((r) => window.addEventListener('popstate', () => r(), { once: true }));
    expect(backFromDomPath()).toBe(true);
    await popped;
    expect(currentDomPath()).toBe('/');
    expect(backFromDomPath()).toBe(false);
  });

  it('seeds the path from the page pathname (web/dev and parity load the DOM entry at /privacy); an explicit root wins', () => {
    window.history.replaceState(null, '', '/terms');
    expect(currentDomPath()).toBe('/terms');
    setDomPath('/');
    expect(currentDomPath()).toBe('/');
    window.history.replaceState(null, '', '/settings');
    expect(currentDomPath()).toBe('/');
  });

  it('ignores a forged or non-allow-listed state path', () => {
    window.history.replaceState({ swift2Path: '/settings' }, '');
    expect(currentDomPath()).toBe('/');
    expect(DOM_PATH_EVENT).toBe('swift2:dompath');
  });
});

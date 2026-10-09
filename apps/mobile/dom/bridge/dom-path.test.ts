// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dismissTopOverlayFromNativeBack, pushBackEntry, resetBackStackForTests, waitForBackStackIdle } from '@swift2/ui/reader/lib/useBackDismiss';
import { backFromDomPath, currentDomPath, currentDomUrl, DOM_PATH_EVENT, isDomPath, setDomPath, subscribeDomPath } from './dom-path';

afterEach(() => {
  resetBackStackForTests();
  window.history.replaceState(null, '', '/');
});

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

  it('every distinct legal page pushes, the same page is a no-op, back-to-root pushes too, and every change notifies', () => {
    const len = window.history.length;
    const cb = vi.fn();
    const off = subscribeDomPath(cb);
    setDomPath('/privacy');
    expect(window.history.length).toBe(len + 1);
    setDomPath('/terms');
    expect(window.history.length).toBe(len + 2);
    setDomPath('/terms');
    setDomPath('/');
    expect(window.history.length).toBe(len + 3);
    expect(cb).toHaveBeenCalledTimes(3);
    off();
    setDomPath('/support');
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it('back from a legal page reached from another legal page returns to that page, then the reader', async () => {
    const popped = () => new Promise<void>((r) => window.addEventListener('popstate', () => r(), { once: true }));
    setDomPath('/privacy');
    setDomPath('/terms');
    let p = popped();
    expect(backFromDomPath()).toBe(true);
    await p;
    expect(currentDomPath()).toBe('/privacy');
    p = popped();
    expect(backFromDomPath()).toBe(true);
    await p;
    expect(currentDomPath()).toBe('/');
    expect(backFromDomPath()).toBe(false);
  });

  it('legal Back pops only the legal entry: the reader nav entry beneath is not restored', async () => {
    const restore = vi.fn();
    pushBackEntry(restore);
    setDomPath('/privacy');
    setDomPath('/terms');
    for (const expected of ['/privacy', '/']) {
      const p = new Promise<void>((r) => window.addEventListener('popstate', () => r(), { once: true }));
      expect(backFromDomPath()).toBe(true);
      await p;
      expect(currentDomPath()).toBe(expected);
      expect(restore).not.toHaveBeenCalled();
    }
    expect(backFromDomPath()).toBe(false);
    expect(dismissTopOverlayFromNativeBack()).toBe(true);
    await waitForBackStackIdle();
    expect(restore).toHaveBeenCalledTimes(1);
  });

  it('native Back over legal pages unwinds one entry per press, then the reader entry, never two at once', async () => {
    const restore = vi.fn();
    pushBackEntry(restore);
    setDomPath('/privacy');
    setDomPath('/terms');
    const press = async () => {
      const handled = backFromDomPath() || dismissTopOverlayFromNativeBack();
      await new Promise((r) => setTimeout(r, 20));
      await waitForBackStackIdle();
      return handled;
    };
    expect(await press()).toBe(true);
    expect(currentDomPath()).toBe('/privacy');
    expect(restore).not.toHaveBeenCalled();
    expect(await press()).toBe(true);
    expect(currentDomPath()).toBe('/');
    expect(restore).not.toHaveBeenCalled();
    expect(await press()).toBe(true);
    expect(restore).toHaveBeenCalledTimes(1);
    expect(await press()).toBe(false);
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

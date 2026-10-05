import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { APP_ORIGIN, AppImage, createAppAdapter } from './app-adapter';
import { classifyHref, createAppStorage, handleLinkClick, installBlankCapture, type ClickLike } from './app-adapter-nav';

const click = (over: Partial<ClickLike> = {}): ClickLike => ({
  defaultPrevented: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  preventDefault: vi.fn(),
  ...over,
});

function setup(native: (p: string) => boolean = (p) => p.startsWith('/settings'), path = '/era/lover?x=1') {
  const call = vi.fn(async () => ({ ok: true as const, value: null }));
  const navigateDom = vi.fn();
  const adapter = createAppAdapter({
    client: { call } as never,
    insets: { top: 1, right: 2, bottom: 3, left: 4 },
    isNativeRoute: native,
    navigateDom,
    getPath: () => path,
    apiFetch: vi.fn() as never,
    onBack: () => () => {},
    storage: { local: createAppStorage(() => null), session: createAppStorage(() => null) },
  });
  return { adapter, call, navigateDom };
}

const BACKSLASH_EVIL = '/\\evil';

describe('classifyHref', () => {
  const o = APP_ORIGIN;
  it('maps valid paths and same-origin urls to dom, other https to external, bare fragments pass', () => {
    expect(classifyHref('/a?b=1#c', o)).toEqual({ kind: 'dom', path: '/a?b=1#c' });
    expect(classifyHref(`${o}/x?y=2`, o)).toEqual({ kind: 'dom', path: '/x?y=2' });
    expect(classifyHref('https://example.com/p', o)).toEqual({ kind: 'external', url: 'https://example.com/p' });
    expect(classifyHref('#frag', o).kind).toBe('pass');
  });
  it.each([
    BACKSLASH_EVIL,
    '//host/x',
    '/a/../b',
    '/a//b',
    '/%2e%2e/x',
    'javascript:alert(1)',
    'intent://scan#Intent;scheme=zxing;end',
    'file:///etc/passwd',
    'mailto:a@b.c',
    'data:text/html,x',
    'relative/path',
    '',
    'https://',
  ])('blocks %s', (href) => {
    expect(classifyHref(href, o).kind).toBe('blocked');
  });
});

describe('handleLinkClick', () => {
  const deps = () => ({ origin: APP_ORIGIN, navigate: vi.fn(), openExternal: vi.fn() });
  const plain = { blank: false, external: false };
  const blank = { blank: true, external: false };

  it('intercepts in-app links and navigates', () => {
    const d = deps();
    const e = click();
    handleLinkClick(e, '/threads', plain, d);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(d.navigate).toHaveBeenCalledWith('/threads');
  });
  it('sends external https to openExternal', () => {
    const d = deps();
    const e = click();
    handleLinkClick(e, 'https://example.com/a', plain, d);
    expect(d.openExternal).toHaveBeenCalledWith('https://example.com/a');
    expect(e.preventDefault).toHaveBeenCalled();
  });
  it('upgrades external http to https and opens it', () => {
    const d = deps();
    const e = click();
    handleLinkClick(e, 'http://example.com/a?b=1', plain, d);
    expect(d.openExternal).toHaveBeenCalledWith('https://example.com/a?b=1');
    expect(e.preventDefault).toHaveBeenCalled();
  });
  it('leaves an already-handled click and bare fragments alone', () => {
    const d = deps();
    const handled = click({ defaultPrevented: true });
    handleLinkClick(handled, '/x', plain, d);
    expect(handled.preventDefault).not.toHaveBeenCalled();
    const frag = click();
    handleLinkClick(frag, '#a', plain, d);
    expect(frag.preventDefault).not.toHaveBeenCalled();
    expect(d.navigate).not.toHaveBeenCalled();
  });
  it('consumes blocked hrefs (never navigates), whatever the modifiers', () => {
    for (const href of [BACKSLASH_EVIL, '//host', '/a/../b', 'javascript:alert(1)', 'intent://x#Intent;end', 'file:///x']) {
      for (const over of [{}, { metaKey: true }, { button: 1 }, { shiftKey: true }]) {
        const d = deps();
        const e = click(over);
        handleLinkClick(e, href, plain, d);
        expect(e.preventDefault).toHaveBeenCalled();
        expect(d.navigate).not.toHaveBeenCalled();
        expect(d.openExternal).not.toHaveBeenCalled();
      }
    }
  });
  it('consumes every _blank click regardless of modifiers or button, and still acts on valid targets', () => {
    for (const over of [{}, { metaKey: true }, { ctrlKey: true }, { button: 1 }, { altKey: true }]) {
      const d = deps();
      const e = click(over);
      handleLinkClick(e, 'https://example.com/z', blank, d);
      expect(e.preventDefault).toHaveBeenCalled();
      expect(d.openExternal).toHaveBeenCalledWith('https://example.com/z');
      for (const href of ['mailto:a@b.c', '#frag']) {
        const e2 = click(over);
        handleLinkClick(e2, href, blank, d);
        expect(e2.preventDefault).toHaveBeenCalled();
      }
    }
  });
  it('consumes a modified click on an ordinary valid link without acting', () => {
    const d = deps();
    const e = click({ ctrlKey: true });
    handleLinkClick(e, '/threads', plain, d);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(d.navigate).not.toHaveBeenCalled();
  });
});

describe('installBlankCapture', () => {
  it('intercepts a[target=_blank] clicks and uninstalls', () => {
    let fn: ((e: never) => void) | null = null;
    const doc = {
      addEventListener: (_t: 'click', f: (e: never) => void, c?: boolean) => {
        expect(c).toBe(true);
        fn = f;
      },
      removeEventListener: vi.fn(),
    };
    const d = { origin: APP_ORIGIN, navigate: vi.fn(), openExternal: vi.fn() };
    const off = installBlankCapture(doc, d);
    const anchor = { getAttribute: () => 'https://example.com/z' };
    const e = { ...click(), target: { closest: (sel: string) => (sel === 'a[target="_blank"]' ? anchor : null) } };
    fn!(e as never);
    expect(d.openExternal).toHaveBeenCalledWith('https://example.com/z');
    const none = { ...click(), target: { closest: () => null } };
    fn!(none as never);
    expect(none.preventDefault).not.toHaveBeenCalled();
    off();
    expect(doc.removeEventListener).toHaveBeenCalledWith('click', fn, true);
  });
});

describe('createAppStorage (tri-state, #4923)', () => {
  it('returns null for an absent key and the value once set', () => {
    const m = new Map<string, string>();
    const s = createAppStorage(() => ({
      getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
      setItem: (k, v) => void m.set(k, v),
      removeItem: (k) => void m.delete(k),
    }));
    expect(s.get('missing')).toBeNull();
    s.set('k', 'v');
    expect(s.get('k')).toBe('v');
    s.remove('k');
    expect(s.get('k')).toBeNull();
  });
  it('returns undefined only when unavailable or throwing; writes never throw', () => {
    const none = createAppStorage(() => null);
    expect(none.get('k')).toBeUndefined();
    expect(() => none.set('k', 'v')).not.toThrow();
    expect(() => none.remove('k')).not.toThrow();
    const boom = createAppStorage(() => {
      throw new Error('denied');
    });
    expect(boom.get('k')).toBeUndefined();
    expect(() => boom.set('k', 'v')).not.toThrow();
  });
});

describe('createAppAdapter', () => {
  it('currentUrl is the in-DOM web path on the canonical origin, never file://', () => {
    const { adapter } = setup();
    expect(adapter.currentUrl?.()).toBe(`${APP_ORIGIN}/era/lover?x=1`);
  });
  it('currentUrl never leaks a non-web path (file:, //, malformed) and falls back to the root', () => {
    for (const bad of ['file:///data/app/index.html', '//evil.test/x', '/a/../b', 'C:\\x', '', 'https://other.test/x']) {
      expect(setup(undefined, bad).adapter.currentUrl?.()).toBe(`${APP_ORIGIN}/`);
    }
  });
  it('navigate drops an invalid path instead of falling through to the DOM', () => {
    const { adapter, call, navigateDom } = setup();
    for (const bad of [BACKSLASH_EVIL, '//host', '/a/../b', 'javascript:alert(1)']) adapter.navigate(bad);
    expect(navigateDom).not.toHaveBeenCalled();
    expect(call).not.toHaveBeenCalled();
  });
  it('sets embedOrigin to the adapter origin (#4960)', () => {
    expect(setup().adapter.embedOrigin).toBe(APP_ORIGIN);
    const a = createAppAdapter({
      client: { call: vi.fn() } as never,
      origin: 'https://preview.example',
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
      isNativeRoute: () => false,
      navigateDom: vi.fn(),
      getPath: () => '/',
      apiFetch: vi.fn() as never,
      onBack: () => () => {},
    });
    expect(a.embedOrigin).toBe('https://preview.example');
  });
  it('names the native platform, never web: ios, android, else the generic app', () => {
    const make = (platform?: string) =>
      createAppAdapter({
        client: { call: vi.fn() } as never,
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
        platform,
        isNativeRoute: () => false,
        navigateDom: vi.fn(),
        getPath: () => '/',
        apiFetch: vi.fn() as never,
        onBack: () => () => {},
      }).platform;
    expect(make('ios')).toBe('ios');
    expect(make('android')).toBe('android');
    expect(make('windows')).toBe('app');
    expect(make(undefined)).toBe('app');
  });
  it('env, insets and resolveUrl', () => {
    const { adapter } = setup();
    expect(adapter.env).toEqual({ turnstileSiteKey: null, origin: APP_ORIGIN });
    expect(adapter.insets).toEqual({ top: 1, right: 2, bottom: 3, left: 4 });
    expect(adapter.resolveUrl?.('/eras/a.png')).toBe(`${APP_ORIGIN}/eras/a.png`);
  });
  it('navigate: native-owned over the bridge, the rest in the DOM', () => {
    const { adapter, call, navigateDom } = setup();
    adapter.navigate('/settings/notifications', { replace: true });
    expect(call).toHaveBeenCalledWith('navigate', { path: '/settings/notifications', replace: true });
    adapter.navigate('/threads');
    expect(navigateDom).toHaveBeenCalledWith('/threads', undefined);
  });
  it('openExternal only forwards https urls; haptic and share use the bridge', async () => {
    const { adapter, call } = setup();
    adapter.openExternal?.('https://example.com');
    adapter.openExternal?.('javascript:alert(1)');
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith('openExternal', { url: 'https://example.com' });
    adapter.haptic?.('light');
    expect(call).toHaveBeenCalledWith('haptic', { kind: 'light' });
    await adapter.share?.({ title: 't' });
    expect(call).toHaveBeenCalledWith('share', { title: 't' });
  });
  it('theme is a fire-and-forget event, never a call', () => {
    const call = vi.fn();
    const sendEvent = vi.fn();
    const a = createAppAdapter({
      client: { call, sendEvent } as never,
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
      isNativeRoute: () => false,
      navigateDom: vi.fn(),
      getPath: () => '/',
      apiFetch: vi.fn() as never,
      onBack: () => () => {},
      storage: { local: createAppStorage(() => null), session: createAppStorage(() => null) },
    });
    a.theme?.({ statusBarStyle: 'dark', background: '#ffffff' });
    expect(sendEvent).toHaveBeenCalledWith('theme', { statusBarStyle: 'dark', background: '#ffffff' });
    expect(call).not.toHaveBeenCalled();
  });
  it('share rejects when the bridge reports failure', async () => {
    const call = vi.fn(async () => ({ ok: false as const, error: { code: 'failed', message: 'x' } }));
    const a = createAppAdapter({
      client: { call } as never,
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
      isNativeRoute: () => false,
      navigateDom: vi.fn(),
      getPath: () => '/',
      apiFetch: vi.fn() as never,
      onBack: () => () => {},
    });
    await expect(a.share?.({ text: 'x' })).rejects.toThrow('share failed');
  });
  it('Link renders an anchor; external adds target and rel', () => {
    const { adapter } = setup();
    const html = renderToStaticMarkup(createElement(adapter.Link, { href: '/a', className: 'c' }, 'go'));
    expect(html).toBe('<a class="c" href="/a">go</a>');
    const ext = renderToStaticMarkup(createElement(adapter.Link, { href: 'https://example.com', external: true }, 'x'));
    expect(ext).toContain('target="_blank"');
    expect(ext).toContain('rel="noopener noreferrer"');
  });
});

describe('AppImage', () => {
  it('replicates the next/image fill inline styles and keeps caller style', () => {
    const html = renderToStaticMarkup(
      createElement(AppImage, { src: '/a.png', alt: 'a', fill: true, className: 'object-cover', style: { opacity: 0.5 } }),
    );
    expect(html).toContain('position:absolute');
    expect(html).toContain('inset:0');
    expect(html).toContain('width:100%');
    expect(html).toContain('height:100%');
    expect(html).toContain('opacity:0.5');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('referrerPolicy="no-referrer"');
  });
  it('priority loads eagerly; width/height pass through without fill', () => {
    const html = renderToStaticMarkup(createElement(AppImage, { src: '/a.png', alt: '', priority: true, width: 10, height: 20 }));
    expect(html).toContain('loading="eager"');
    expect(html).toContain('width="10"');
    expect(html).toContain('height="20"');
  });
});

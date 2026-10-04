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

function setup(native: (p: string) => boolean = (p) => p.startsWith('/settings')) {
  const call = vi.fn(async () => ({ ok: true as const, value: null }));
  const navigateDom = vi.fn();
  const adapter = createAppAdapter({
    client: { call } as never,
    insets: { top: 1, right: 2, bottom: 3, left: 4 },
    isNativeRoute: native,
    navigateDom,
    getPath: () => '/era/lover?x=1',
    apiFetch: vi.fn() as never,
    onBack: () => () => {},
    storage: { local: createAppStorage(() => null), session: createAppStorage(() => null) },
  });
  return { adapter, call, navigateDom };
}

describe('classifyHref', () => {
  const o = APP_ORIGIN;
  it('maps paths and same-origin urls to dom, other https to external, the rest pass', () => {
    expect(classifyHref('/a?b=1#c', o)).toEqual({ kind: 'dom', path: '/a?b=1#c' });
    expect(classifyHref(`${o}/x?y=2`, o)).toEqual({ kind: 'dom', path: '/x?y=2' });
    expect(classifyHref('https://example.com/p', o)).toEqual({ kind: 'external', url: 'https://example.com/p' });
    expect(classifyHref('//evil.test/x', o).kind).toBe('pass');
    expect(classifyHref('mailto:a@b.c', o).kind).toBe('pass');
    expect(classifyHref('#frag', o).kind).toBe('pass');
    expect(classifyHref('http://example.com', o).kind).toBe('pass');
  });
});

describe('handleLinkClick', () => {
  const deps = () => ({ origin: APP_ORIGIN, navigate: vi.fn(), openExternal: vi.fn() });
  const plain = { blank: false, external: false };

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
  it('leaves handled, non-primary and modified clicks alone', () => {
    const d = deps();
    for (const over of [{ defaultPrevented: true }, { button: 1 }, { metaKey: true }, { shiftKey: true }]) {
      const e = click(over);
      handleLinkClick(e, '/x', plain, d);
      expect(e.preventDefault).not.toHaveBeenCalled();
    }
    expect(d.navigate).not.toHaveBeenCalled();
  });
  it('blocks an unclassifiable _blank target instead of navigating the host webview', () => {
    const d = deps();
    const e = click();
    handleLinkClick(e, 'mailto:a@b.c', { blank: true, external: false }, d);
    expect(e.preventDefault).toHaveBeenCalled();
    const e2 = click();
    handleLinkClick(e2, 'mailto:a@b.c', plain, d);
    expect(e2.preventDefault).not.toHaveBeenCalled();
  });
});

describe('installBlankCapture', () => {
  it('captures a[target=_blank] clicks in the capture phase and uninstalls', () => {
    let fn: ((e: never) => void) | null = null;
    let capture: boolean | null = null;
    const doc = {
      addEventListener: (_t: 'click', f: (e: never) => void, c: boolean) => {
        fn = f;
        capture = c;
      },
      removeEventListener: vi.fn(),
    };
    const d = { origin: APP_ORIGIN, navigate: vi.fn(), openExternal: vi.fn() };
    const off = installBlankCapture(doc, d);
    expect(capture).toBe(true);
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
  const area = () => {
    const m = new Map<string, string>();
    return {
      getItem: (k: string) => (m.has(k) ? (m.get(k) as string) : null),
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    };
  };
  it('returns null for an absent key and the value once set', () => {
    const s = createAppStorage(() => area());
    const a = area();
    const s2 = createAppStorage(() => a);
    expect(s.get('missing')).toBeNull();
    s2.set('k', 'v');
    expect(s2.get('k')).toBe('v');
    s2.remove('k');
    expect(s2.get('k')).toBeNull();
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

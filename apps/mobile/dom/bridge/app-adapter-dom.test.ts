// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { APP_ORIGIN, createAppAdapter } from './app-adapter';
import { installBlankCapture } from './app-adapter-nav';

describe('installBlankCapture with real DOM events', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function mount(href: string) {
    document.body.innerHTML = `<div id="wrap"><a id="a" target="_blank" href="${href}"><span id="in">x</span></a></div>`;
    const deps = { origin: APP_ORIGIN, navigate: vi.fn(), openExternal: vi.fn() };
    const off = installBlankCapture(document as never, deps);
    return { deps, off, a: document.getElementById('a')!, inner: document.getElementById('in')! };
  }
  const fire = (el: Element, init: MouseEventInit = {}) => {
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
    el.dispatchEvent(ev);
    return ev;
  };

  it('opens externally and consumes the click (child target resolves to the anchor)', () => {
    const { deps, off, inner } = mount('https://example.com/p');
    const ev = fire(inner);
    expect(deps.openExternal).toHaveBeenCalledWith('https://example.com/p');
    expect(ev.defaultPrevented).toBe(true);
    off();
  });

  it('still intercepts when a bubble listener stops propagation (capture phase)', () => {
    const { deps, off, inner } = mount('https://x.example/');
    inner.addEventListener('click', (e) => e.stopPropagation());
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    expect(inner.dispatchEvent(ev)).toBe(false);
    expect(deps.openExternal).toHaveBeenCalledTimes(1);
    expect(deps.openExternal).toHaveBeenCalledWith('https://x.example/');
    off();
  });

  it('consumes a blocked scheme even when propagation is stopped', () => {
    const { deps, off, inner } = mount('javascript:alert(1)');
    inner.addEventListener('click', (e) => e.stopPropagation());
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    expect(inner.dispatchEvent(ev)).toBe(false);
    expect(deps.openExternal).not.toHaveBeenCalled();
    expect(deps.navigate).not.toHaveBeenCalled();
    off();
  });

  it('an external Link click reaches openExternal exactly once (no double dispatch with the capture)', async () => {
    const call = vi.fn(async () => ({ ok: true as const, value: null }));
    const adapter = createAppAdapter({
      client: { call } as never,
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
      isNativeRoute: () => false,
      navigateDom: vi.fn(),
      getPath: () => '/',
      apiFetch: vi.fn() as never,
      onBack: () => () => {},
    });
    const deps = { origin: APP_ORIGIN, navigate: vi.fn(), openExternal: adapter.openExternal! };
    const off = installBlankCapture(document as never, deps);
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(createElement(adapter.Link, { href: 'https://x.example/', external: true }, 'go'));
    });
    host.querySelector('a')!.click();
    expect(call.mock.calls.filter((c) => (c as unknown[])[0] === 'openExternal')).toHaveLength(1);
    await act(async () => root.unmount());
    off();
  });

  it('consumes modified and non-primary _blank clicks, and blocked schemes', () => {
    const m = mount('https://example.com/p');
    expect(fire(m.a, { ctrlKey: true }).defaultPrevented).toBe(true);
    expect(fire(m.a, { button: 1 }).defaultPrevented).toBe(true);
    m.off();
    const bad = mount('javascript:alert(1)');
    expect(fire(bad.a).defaultPrevented).toBe(true);
    expect(bad.deps.openExternal).not.toHaveBeenCalled();
    expect(bad.deps.navigate).not.toHaveBeenCalled();
    bad.off();
  });

  it('stops intercepting after uninstall', () => {
    const { deps, off, a } = mount('https://example.com/p');
    off();
    fire(a);
    expect(deps.openExternal).not.toHaveBeenCalled();
  });
});

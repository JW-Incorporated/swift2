// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { APP_ORIGIN } from './app-adapter';
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

  it('respects a page handler that already called preventDefault (bubble phase)', () => {
    const { deps, off, a } = mount('https://example.com/p');
    a.addEventListener('click', (e) => e.preventDefault());
    fire(a);
    expect(deps.openExternal).not.toHaveBeenCalled();
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

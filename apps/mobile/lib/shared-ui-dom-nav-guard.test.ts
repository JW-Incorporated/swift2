import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ Linking: { openURL: vi.fn(async () => {}) }, StyleSheet: { create: (s: unknown) => s } }));
vi.mock('./theme', () => ({ eraColors: { bg: '#000' } }));

import { createDomNavGuard, sharedUiDomProps } from './shared-ui-dom-props';

const HOME = 'http://192.168.1.5:8081/dom/abc.html';

function setup() {
  const open = vi.fn();
  const guard = createDomNavGuard(open);
  expect(guard({ url: HOME, isTopFrame: true })).toBe(true);
  return { open, guard };
}

describe('DOM webview navigation guard', () => {
  it('allows the bundled DOM page and same-origin top-frame loads', () => {
    const { guard, open } = setup();
    expect(guard({ url: 'http://192.168.1.5:8081/other.html', isTopFrame: true })).toBe(true);
    expect(open).not.toHaveBeenCalled();
  });

  it('allows file: home pages', () => {
    const guard = createDomNavGuard(vi.fn());
    expect(guard({ url: 'file:///data/app/dom/index.html', isTopFrame: true })).toBe(true);
    expect(guard({ url: 'file:///data/app/dom/x.html', isTopFrame: true })).toBe(true);
  });

  it('allows about:blank and https embed sub-frames', () => {
    const { guard } = setup();
    expect(guard({ url: 'about:blank', isTopFrame: true })).toBe(true);
    expect(guard({ url: 'https://www.longlivets.com/embed/youtube/abc', isTopFrame: false })).toBe(true);
    expect(guard({ url: 'https://open.spotify.com/embed/album/1', isTopFrame: false })).toBe(true);
  });

  it('blocks other top-level https navigation and routes it to openExternal', () => {
    const { guard, open } = setup();
    expect(guard({ url: 'https://example.com/x', isTopFrame: true })).toBe(false);
    expect(open).toHaveBeenCalledWith('https://example.com/x');
  });

  it('blocks non-openable schemes without opening them', () => {
    const { guard, open } = setup();
    expect(guard({ url: 'javascript:alert(1)', isTopFrame: true })).toBe(false);
    expect(guard({ url: 'intent://x#Intent;end', isTopFrame: true })).toBe(false);
    expect(guard({ url: 'file:///etc/hosts', isTopFrame: true })).toBe(false);
    expect(guard({ url: 'data:text/html,hi', isTopFrame: false })).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });

  it('is wired into the DOM props', () => {
    const dom = sharedUiDomProps({ onContentProcessDidTerminate: vi.fn(), onRenderProcessGone: vi.fn() }, vi.fn());
    expect(typeof dom.onShouldStartLoadWithRequest).toBe('function');
  });
});

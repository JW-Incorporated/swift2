// @vitest-environment jsdom
import { render, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostProvider, useHost } from '@swift2/ui';

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children?: React.ReactNode; className?: string }) => (
    <a data-next-link href={href} className={className}>
      {children}
    </a>
  ),
}));
vi.mock('next/image', () => ({
  default: ({ src, alt, fill }: { src: string; alt: string; fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img data-next-image data-fill={fill ? '1' : '0'} src={src} alt={alt} />
  ),
}));

import { WebImage, WebLink, createWebAdapter, createWebStorage } from './host-adapter';

const router = { push: vi.fn(), replace: vi.fn() };

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  router.push.mockClear();
  router.replace.mockClear();
});

describe('web host adapter', () => {
  it('Link renders next/link output; external renders a new-tab anchor', () => {
    const a = render(<WebLink href="/x">go</WebLink>).container.querySelector('a');
    expect(a?.hasAttribute('data-next-link')).toBe(true);
    const b = render(
      <WebLink href="https://e.test" external>
        out
      </WebLink>,
    ).container.querySelector('a');
    expect(b?.getAttribute('target')).toBe('_blank');
    expect(b?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('Image renders next/image output', () => {
    const img = render(<WebImage src="/a.png" alt="a" fill />).container.querySelector('img');
    expect(img?.hasAttribute('data-next-image')).toBe(true);
    expect(img?.getAttribute('data-fill')).toBe('1');
  });

  it('Link/Image keep stable identity across adapter rebuilds', () => {
    const one = createWebAdapter(router);
    const two = createWebAdapter(router);
    expect(one.Link).toBe(two.Link);
    expect(one.Image).toBe(two.Image);
    expect(one).not.toBe(two);
  });

  it('is usable through HostProvider/useHost', () => {
    const adapter = createWebAdapter(router);
    const { result } = renderHook(() => useHost(), {
      wrapper: ({ children }) => <HostProvider adapter={adapter}>{children}</HostProvider>,
    });
    expect(result.current.Link).toBe(WebLink);
  });

  it('navigate pushes, or replaces with opts.replace', () => {
    const adapter = createWebAdapter(router);
    adapter.navigate('/a');
    adapter.navigate('/b', { replace: true });
    expect(router.push).toHaveBeenCalledWith('/a');
    expect(router.replace).toHaveBeenCalledWith('/b');
  });

  it('apiFetch is a same-origin relative fetch', async () => {
    const fetchMock = vi.fn(async () => new Response('ok', { status: 201, headers: { 'x-a': 'b' } }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await createWebAdapter(router).apiFetch({ method: 'POST', path: '/api/ping', body: '{}' });
    expect(fetchMock).toHaveBeenCalledWith('/api/ping', { method: 'POST', headers: undefined, body: '{}' });
    expect(res).toMatchObject({ status: 201, body: 'ok', headers: { 'x-a': 'b' } });
  });

  it('onBack fires on popstate and unsubscribe stops it', () => {
    const handler = vi.fn(() => true);
    const off = createWebAdapter(router).onBack(handler);
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(handler).toHaveBeenCalledTimes(1);
    off();
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('storage round-trips and survives a throwing localStorage', () => {
    const s = createWebStorage('localStorage');
    s.set('k', 'v');
    expect(s.get('k')).toBe('v');
    s.remove('k');
    expect(s.get('k')).toBeNull();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    expect(s.get('k')).toBeNull();
    expect(() => s.set('k', 'v')).not.toThrow();
  });

  it('env: turnstile key null when unset, string when set', () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
    expect(createWebAdapter(router).env.turnstileSiteKey).toBeNull();
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site');
    expect(createWebAdapter(router).env.turnstileSiteKey).toBe('site');
    vi.unstubAllEnvs();
  });
});

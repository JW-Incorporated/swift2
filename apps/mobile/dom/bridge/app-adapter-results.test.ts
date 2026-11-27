import { describe, expect, it, vi } from 'vitest';
import { createAppAdapter } from './app-adapter';

type Client = Parameters<typeof createAppAdapter>[0]['client'];
const make = (client: Client) =>
  createAppAdapter({
    client,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    isNativeRoute: () => false,
    navigateDom: vi.fn(),
    getPath: () => '/',
    apiFetch: vi.fn() as never,
    onBack: () => () => {},
  });
const ok = () => vi.fn(async () => ({ ok: true as const, value: null }));
const failing = (code: string) => make({ call: vi.fn(async () => ({ ok: false as const, error: { code, message: 'x' } })) } as never);

describe('app adapter: results the reader can act on', () => {
  it('a superseded share (cancelled) rejects as an AbortError, the reader’s quiet cancel', async () => {
    await expect(failing('cancelled').share?.({ text: 'x' })).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('openExternal resolves true on success, false on a failed open or a refused url', async () => {
    const a = make({ call: ok() } as never);
    await expect(a.openExternal?.('https://example.com')).resolves.toBe(true);
    await expect(a.openExternal?.('javascript:alert(1)')).resolves.toBe(false);
    await expect(failing('failed').openExternal?.('https://example.com')).resolves.toBe(false);
  });

  it('notifications.openSettings goes over the bridge and rejects on failure', async () => {
    const call = ok();
    await make({ call } as never).notifications?.openSettings?.();
    expect(call).toHaveBeenCalledWith('notifications.openSettings', {});
    await expect(failing('failed').notifications?.openSettings?.()).rejects.toThrow('notification request failed');
  });
});

describe('app adapter: onForeground', () => {
  it('subscribes to the native foreground event and unsubscribes', () => {
    const off = vi.fn();
    let fire: () => void = () => {};
    const on = vi.fn((type: string, fn: () => void) => {
      if (type === 'foreground') fire = fn;
      return off;
    });
    const a = make({ call: ok(), on } as never);
    const seen = vi.fn();
    const unsub = a.onForeground!(seen);
    expect(on).toHaveBeenCalledWith('foreground', expect.any(Function));
    fire();
    expect(seen).toHaveBeenCalledTimes(1);
    unsub();
    expect(off).toHaveBeenCalledTimes(1);
  });

  it('is absent when the client cannot subscribe', () => {
    expect(make({ call: ok() } as never).onForeground).toBeUndefined();
  });
});

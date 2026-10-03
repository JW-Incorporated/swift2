import { describe, expect, it, vi } from 'vitest';
import type { HandlerContext } from '@swift2/ui';
import {
  createBackHandler,
  createContentVersionEmitter,
  createHandlers,
  createInsetsEmitter,
  type UiHandlerDeps,
} from './bridge-handlers-ui';

const ctx: HandlerContext = { signal: new AbortController().signal };
const bad = (v: unknown) => v as never;

function fakeDeps(over: Partial<UiHandlerDeps> = {}) {
  const deps = {
    navigate: vi.fn(),
    openURL: vi.fn(async () => {}),
    share: vi.fn(async () => {}),
    haptic: vi.fn(),
    ...over,
  };
  return { deps, h: createHandlers(deps) };
}

describe('navigate', () => {
  it('navigates a valid web path', async () => {
    const { deps, h } = fakeDeps();
    expect(await h.navigate({ path: bad('/eras/1989?x=1'), replace: true }, ctx)).toEqual({ ok: true, value: null });
    expect(deps.navigate).toHaveBeenCalledWith('/eras/1989?x=1', true);
  });
  it.each(['https://evil.example/x', '//evil.example', '/a/../b', 'eras', '/a\\b', 42, undefined])(
    'rejects %s as invalid without navigating',
    async (path) => {
      const { deps, h } = fakeDeps();
      const r = await h.navigate({ path: bad(path) }, ctx);
      expect(r).toMatchObject({ ok: false, error: { code: 'invalid' } });
      expect(deps.navigate).not.toHaveBeenCalled();
    },
  );
  it('answers invalid for a route the native shell does not own', async () => {
    const { deps, h } = fakeDeps({ isNativeRoute: () => false });
    expect(await h.navigate({ path: bad('/nope') }, ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(deps.navigate).not.toHaveBeenCalled();
  });
  it('maps a throwing navigate to failed, never throws', async () => {
    const { h } = fakeDeps({ navigate: () => { throw new Error('boom'); } });
    expect(await h.navigate({ path: bad('/a') }, ctx)).toMatchObject({ ok: false, error: { code: 'failed' } });
  });
});

describe('openExternal', () => {
  it('opens https', async () => {
    const { deps, h } = fakeDeps();
    expect((await h.openExternal({ url: bad('https://example.com/a?b=1') }, ctx)).ok).toBe(true);
    expect(deps.openURL).toHaveBeenCalledWith('https://example.com/a?b=1');
  });
  it.each(['http://example.com', 'javascript:alert(1)', 'intent://x', 'file:///etc/passwd', 'https://u:p@example.com', 7])(
    'rejects %s',
    async (url) => {
      const { deps, h } = fakeDeps();
      expect(await h.openExternal({ url: bad(url) }, ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
      expect(deps.openURL).not.toHaveBeenCalled();
    },
  );
  it('maps a rejecting openURL to failed', async () => {
    const { h } = fakeDeps({ openURL: async () => { throw new Error('no'); } });
    expect(await h.openExternal({ url: bad('https://example.com') }, ctx)).toMatchObject({ ok: false, error: { code: 'failed' } });
  });
});

describe('share', () => {
  it('resolves after the sheet closes, passing only known fields', async () => {
    let close!: () => void;
    const { h } = fakeDeps({ share: () => new Promise<void>((r) => { close = r; }) });
    let done = false;
    const p = h.share({ title: 't', url: 'https://example.com', extra: 1 } as never, ctx).then((r) => { done = true; return r; });
    await Promise.resolve();
    expect(done).toBe(false);
    close();
    expect(await p).toEqual({ ok: true, value: null });
  });
  it('forwards a clean payload', async () => {
    const { deps, h } = fakeDeps();
    await h.share({ title: 't', text: 'x', url: 'https://example.com', extra: 1 } as never, ctx);
    expect(deps.share).toHaveBeenCalledWith({ title: 't', text: 'x', url: 'https://example.com' });
  });
  it.each([{}, { url: 'javascript:1' }, { text: 5 }, { text: 'x'.repeat(2049) }, null])('rejects %j', async (payload) => {
    const { deps, h } = fakeDeps();
    expect(await h.share(bad(payload), ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(deps.share).not.toHaveBeenCalled();
  });
});

describe('haptic', () => {
  it('fires a valid kind', async () => {
    const { deps, h } = fakeDeps();
    expect((await h.haptic({ kind: 'success' }, ctx)).ok).toBe(true);
    expect(deps.haptic).toHaveBeenCalledWith('success');
  });
  it('rejects an unknown kind', async () => {
    const { deps, h } = fakeDeps();
    expect(await h.haptic({ kind: bad('buzz') }, ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(deps.haptic).not.toHaveBeenCalled();
  });
  it('is a no-op success when haptics are unavailable', async () => {
    const { h } = fakeDeps({ haptic: undefined });
    expect(await h.haptic({ kind: 'light' }, ctx)).toEqual({ ok: true, value: null });
  });
});

describe('createBackHandler', () => {
  const host = (ready: boolean, result: unknown) => ({
    isReady: () => ready,
    request: vi.fn(async () => result as never),
  });
  const flush = () => new Promise((r) => setTimeout(r, 0));

  it('returns false before ready and sends nothing', () => {
    const h = host(false, { ok: true, value: 'handled' });
    const exit = vi.fn();
    expect(createBackHandler(h, exit)()).toBe(false);
    expect(h.request).not.toHaveBeenCalled();
  });
  it('consumes the press; handled does not exit; uses the 1000ms timeout', async () => {
    const h = host(true, { ok: true, value: 'handled' });
    const exit = vi.fn();
    expect(createBackHandler(h, exit)()).toBe(true);
    await flush();
    expect(h.request).toHaveBeenCalledWith('back', {}, { timeoutMs: 1000 });
    expect(exit).not.toHaveBeenCalled();
  });
  it.each([
    ['exit', { ok: true, value: 'exit' }],
    ['timeout', { ok: false, error: { code: 'timeout', message: '' } }],
    ['error', { ok: false, error: { code: 'failed', message: '' } }],
  ])('exits on %s', async (_n, result) => {
    const h = host(true, result);
    const exit = vi.fn();
    expect(createBackHandler(h, exit)()).toBe(true);
    await flush();
    expect(exit).toHaveBeenCalledTimes(1);
  });
  it('exits when request rejects', async () => {
    const exit = vi.fn();
    const h = { isReady: () => true, request: vi.fn(async () => { throw new Error('x'); }) };
    expect(createBackHandler(h as never, exit)()).toBe(true);
    await flush();
    expect(exit).toHaveBeenCalledTimes(1);
  });
});

describe('emitters', () => {
  it('coalesces identical insets and drops invalid values', () => {
    const emit = vi.fn();
    const u = createInsetsEmitter(emit);
    u({ top: 1, right: 0, bottom: 2, left: 0 });
    u({ top: 1, right: 0, bottom: 2, left: 0 });
    u({ top: Number.NaN, right: 0, bottom: 2, left: 0 });
    u({ top: -1, right: 0, bottom: 2, left: 0 });
    u({ top: 1, right: 0, bottom: 3, left: 0 });
    expect(emit.mock.calls.map((c) => c[0].bottom)).toEqual([2, 3]);
  });
  it('emits contentVersion only on change', () => {
    const emit = vi.fn();
    const u = createContentVersionEmitter(emit);
    u('a');
    u('a');
    u('b');
    expect(emit.mock.calls).toEqual([[{ token: 'a' }], [{ token: 'b' }]]);
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { HandlerContext, WebPath } from '@swift2/ui';
import { createHandlers } from './bridge-handlers-ui';
import { createUiDeps, type HapticsLike, type UiDepsEnv } from './ui-deps';

const ctx: HandlerContext = { signal: new AbortController().signal };
const path = (p: string) => p as never;
const url = (u: string) => u as never;

const haptics = (): HapticsLike => ({
  impactAsync: vi.fn(async () => {}),
  notificationAsync: vi.fn(async () => {}),
  selectionAsync: vi.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'il', Medium: 'im', Heavy: 'ih' },
  NotificationFeedbackType: { Success: 'ns', Warning: 'nw', Error: 'ne' },
});

function setup(over: Partial<UiDepsEnv> = {}) {
  const env = {
    linking: { openURL: vi.fn(async () => true) },
    share: { share: vi.fn(async () => ({})) },
    haptics: haptics(),
    platformOS: 'ios',
    log: vi.fn(),
    ...over,
  } satisfies UiDepsEnv;
  return { env, h: createHandlers(createUiDeps(env)) };
}

describe('navigate', () => {
  it('a native route goes to the presenter, never stays in the DOM', async () => {
    const present = vi.fn(() => 'applied');
    const { h } = setup({ getPresenter: () => present });
    expect(await h.navigate({ path: path('/inbox') }, ctx)).toEqual({ ok: true, value: null });
    expect(present).toHaveBeenCalledWith('/inbox');
  });

  it.each(['/', '/?current=theories', '/?song=abc', '/vault', '/settings', '/?screen=nope', '/?screen=settings', '/?current=inbox'])('a DOM route (%s) stays in the DOM: invalid, presenter untouched', async (p) => {
    const present = vi.fn();
    const { h } = setup({ getPresenter: () => present });
    expect(await h.navigate({ path: path(p) }, ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(present).not.toHaveBeenCalled();
  });

  it('a native route with no presenter attached answers failed, not success', async () => {
    const { h, env } = setup();
    expect(await h.navigate({ path: path('/inbox') }, ctx)).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(env.log).toHaveBeenCalledWith('bridge-navigate-failed', expect.stringContaining('presenter'));
  });

  it('a presenter that rejects the route answers failed', async () => {
    const { h } = setup({ getPresenter: () => () => 'rejected' });
    expect(await h.navigate({ path: path('/settings/about') }, ctx)).toMatchObject({ ok: false, error: { code: 'failed' } });
  });

  it('reads the presenter at call time (attached after the host was built)', async () => {
    const ref: { present?: (p: WebPath) => unknown } = {};
    const { h } = setup({ getPresenter: () => ref.present });
    expect(await h.navigate({ path: path('/settings/about') }, ctx)).toMatchObject({ ok: false });
    ref.present = vi.fn();
    expect(await h.navigate({ path: path('/settings/about') }, ctx)).toEqual({ ok: true, value: null });
  });
});

describe('openExternal', () => {
  it('opens https via Linking', async () => {
    const { h, env } = setup();
    expect(await h.openExternal({ url: url('https://example.com/a') }, ctx)).toEqual({ ok: true, value: null });
    expect(env.linking.openURL).toHaveBeenCalledWith('https://example.com/a');
  });

  it('refuses other schemes without calling Linking', async () => {
    const { h, env } = setup();
    expect(await h.openExternal({ url: url('javascript:alert(1)') }, ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(env.linking.openURL).not.toHaveBeenCalled();
  });

  it('a Linking failure answers failed', async () => {
    const { h } = setup({ linking: { openURL: vi.fn(async () => Promise.reject(new Error('nope'))) } });
    expect(await h.openExternal({ url: url('https://example.com') }, ctx)).toMatchObject({ ok: false, error: { code: 'failed' } });
  });
});

describe('share', () => {
  it('iOS passes title, message and url separately', async () => {
    const { h, env } = setup();
    await h.share({ title: 'T', text: 'x', url: 'https://example.com/s' }, ctx);
    expect(env.share.share).toHaveBeenCalledWith({ title: 'T', message: 'x', url: 'https://example.com/s' });
  });

  it('Android folds the url into the message (it ignores `url`)', async () => {
    const { h, env } = setup({ platformOS: 'android' });
    await h.share({ title: 'T', text: 'x', url: 'https://example.com/s' }, ctx);
    expect(env.share.share).toHaveBeenCalledWith({ title: 'T', message: 'x\nhttps://example.com/s' });
  });

  it('resolves only after the sheet closes', async () => {
    let close: () => void = () => {};
    const { h } = setup({ share: { share: () => new Promise((r) => (close = () => r({}))) } });
    let done = false;
    const p = h.share({ url: 'https://example.com' }, ctx).then(() => (done = true));
    await Promise.resolve();
    expect(done).toBe(false);
    close();
    await p;
    expect(done).toBe(true);
  });
});

describe('haptic', () => {
  it.each([
    ['light', 'impactAsync', 'il'],
    ['medium', 'impactAsync', 'im'],
    ['heavy', 'impactAsync', 'ih'],
    ['success', 'notificationAsync', 'ns'],
    ['warning', 'notificationAsync', 'nw'],
    ['error', 'notificationAsync', 'ne'],
  ] as const)('%s -> %s(%s)', async (kind, fn, arg) => {
    const { h, env } = setup();
    expect(await h.haptic({ kind }, ctx)).toEqual({ ok: true, value: null });
    expect(env.haptics![fn]).toHaveBeenCalledWith(arg);
  });

  it('selection -> selectionAsync', async () => {
    const { h, env } = setup();
    await h.haptic({ kind: 'selection' }, ctx);
    expect(env.haptics!.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it('is a no-op success when the haptics module is unavailable', async () => {
    const { h } = setup({ haptics: undefined });
    expect(await h.haptic({ kind: 'light' }, ctx)).toEqual({ ok: true, value: null });
  });
});

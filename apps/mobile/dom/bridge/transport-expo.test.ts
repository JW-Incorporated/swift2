import { describe, expect, it } from 'vitest';
import type { Envelope } from '@swift2/ui';
import { createExpoBridge, createExpoBridgeClient } from './transport-expo';

const okRes = (env: Envelope) => ({ v: 1, id: env.id, kind: 'res', type: env.type, payload: { ok: true, value: null }, ts: 1 });

describe('createExpoBridgeClient', () => {
  it('posts through the bridge action and feeds a returned res back', async () => {
    const sent: Envelope[] = [];
    const client = createExpoBridgeClient(
      async (env) => {
        sent.push(env);
        return env.type === 'ready' ? undefined : okRes(env);
      },
      () => 'x1',
    );
    client.sendReady();
    expect(await client.call('haptic', { kind: 'light' })).toEqual({ ok: true, value: null });
    expect(sent.map((e) => e.type)).toEqual(['ready', 'haptic']);
  });

  it('a rejecting bridge action fails the call immediately (no 8 s wait)', async () => {
    const ids = ['r', 'c'];
    const client = createExpoBridgeClient(
      (env) => (env.type === 'ready' ? undefined : Promise.reject(new Error('down'))),
      () => ids.shift() ?? 'z',
    );
    client.sendReady();
    const r = await client.call('haptic', { kind: 'light' });
    expect(r).toMatchObject({ ok: false, error: { code: 'failed' } });
  });

  it('queues calls made before ready and sends them after it, in order', async () => {
    const sent: string[] = [];
    let n = 0;
    const client = createExpoBridgeClient(async (env) => { sent.push(env.type); return env.type === 'ready' ? undefined : okRes(env); }, () => `i${++n}`);
    const a = client.call('haptic', { kind: 'light' });
    const b = client.call('openExternal', { url: 'https://example.com' as never });
    expect(sent).toEqual([]);
    client.sendReady();
    await Promise.all([a, b]);
    expect(sent).toEqual(['ready', 'haptic', 'openExternal']);
  });
});

describe('createExpoBridge (mount lifecycle)', () => {
  it('mount sends ready; StrictMode double-mount stays usable', async () => {
    const sent: string[] = [];
    let n = 0;
    const handle = createExpoBridge(async (env) => { sent.push(env.type); return env.type === 'ready' ? undefined : okRes(env); }, () => `m${++n}`);
    const unmount1 = handle.mount();
    unmount1();
    const unmount2 = handle.mount();
    expect(sent).toEqual(['ready', 'ready']);
    expect(await handle.client.call('haptic', { kind: 'light' })).toEqual({ ok: true, value: null });
    unmount2();
  });

  it('ids stay strictly increasing across dispose/re-create even within one millisecond', () => {
    const ids: string[] = [];
    const handle = createExpoBridge((env) => void ids.push(env.id));
    handle.mount()();
    handle.mount();
    void handle.client.call('haptic', { kind: 'light' });
    const nums = ids.map(Number);
    expect(nums).toHaveLength(3);
    expect(nums.every((id, i) => i === 0 || id > (nums[i - 1] as number))).toBe(true);
    expect(ids.every((id) => /^[0-9]{1,64}$/.test(id))).toBe(true);
  });

  it('a call made by a child before the parent mounts is queued, then flushed on mount', async () => {
    const sent: string[] = [];
    let n = 0;
    const handle = createExpoBridge(async (env) => { sent.push(env.type); return env.type === 'ready' ? undefined : okRes(env); }, () => `p${++n}`);
    const early = handle.client.call('haptic', { kind: 'light' });
    expect(sent).toEqual([]);
    handle.mount();
    expect(await early).toEqual({ ok: true, value: null });
    expect(sent).toEqual(['ready', 'haptic']);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { createBridgeClient } from '@swift2/ui';
import type { BridgeClient, Envelope } from '@swift2/ui';
import { createMapStorage } from '../dom/reader/reader-modules';
import { createWriteCoalescer, LOAD_RETRY_MS, loadStorageSeed, recoverStorage } from '../dom/reader/storage-sync';
import { createHandlers } from './bridge-handlers-ui';
import { setup, tick } from './bridge-host.test-kit';
import { createHostStorage, MAX_BLOB_BYTES, type HostStoragePort } from './host-storage';

// Real dispatcher (validators, result checks) + real DOM client over a fake in-memory transport: no mocked `call`.
function rig(port: HostStoragePort) {
  const log = vi.fn();
  const ui = createHandlers({
    navigate: vi.fn(),
    isNativeRoute: () => true,
    log,
    openURL: vi.fn(async () => {}),
    share: vi.fn(async () => {}),
    hostStorage: createHostStorage(port),
  });
  // eslint-disable-next-line prefer-const -- assigned after setup(); the send closure needs the binding first
  let client!: BridgeClient;
  const t = setup({ 'storage.load': ui['storage.load'], 'storage.write': ui['storage.write'] } as never, {
    send: (e: Envelope) => void client.receive(e),
  });
  client = createBridgeClient({
    post: (e) => void t.host.receive(e),
    now: () => 1000,
    setTimer: (fn, ms) => t.sch.setTimeout(fn, ms),
    clearTimer: (h) => t.sch.clearTimeout(h),
  });
  t.makeReady();
  return { client, log };
}
const mem = (): HostStoragePort & { text: string | null } => {
  const p = { text: null as string | null, read: () => p.text, write: (t: string) => void (p.text = t) };
  return p;
};

describe('storage over the real bridge', () => {
  it('snapshots survive validation and load returns them; the DOM seed receives them', async () => {
    const { client } = rig(mem());
    const w1 = client.call('storage.write', { entries: { a: '1', b: '2' } });
    await tick();
    expect(await w1).toEqual({ ok: true, value: null });
    const w2 = client.call('storage.write', { entries: { b: '2', c: '3' } });
    await tick();
    expect(await w2).toEqual({ ok: true, value: null });
    const seed = loadStorageSeed(client);
    await tick();
    expect(await seed).toEqual({ b: '2', c: '3' });
  });

  it('a blob over the byte cap is invalid, logs a signal, and changes nothing', async () => {
    const port = mem();
    const { client, log } = rig(port);
    const p = client.call('storage.write', { entries: { big: 'é'.repeat(MAX_BLOB_BYTES / 2) } });
    await tick();
    expect(await p).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(log).toHaveBeenCalledWith('bridge-storage.write-rejected', expect.any(String));
    expect(port.text).toBeNull();
  });

  it('an unflagged empty write is refused over the real bridge; the file keeps its entries', async () => {
    const port = mem();
    port.text = JSON.stringify({ outbox: 'queued', draft: 'wip' });
    const { client } = rig(port);
    const p = client.call('storage.write', { entries: {} });
    await tick();
    expect(await p).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(JSON.parse(port.text as string)).toEqual({ outbox: 'queued', draft: 'wip' });
  });

  it('a failed DOM load then a mutation leaves the file intact; the retry merges into it', async () => {
    vi.useFakeTimers();
    try {
      const port = mem();
      port.text = JSON.stringify({ outbox: 'queued', fav: '1' });
      const { client } = rig(port);
      let failing = true;
      const flaky = {
        call: (type: string, payload: unknown) =>
          failing && type === 'storage.load'
            ? Promise.resolve({ ok: false as const, error: { code: 'failed', message: 'x' } })
            : (client.call as (t: string, p: unknown) => Promise<unknown>)(type, payload),
      };
      expect(await loadStorageSeed(flaky as never)).toBeNull();
      // eslint-disable-next-line prefer-const -- late-bound
      let local!: ReturnType<typeof createMapStorage>;
      const sync = createWriteCoalescer(flaky as never, () => local.snapshot());
      local = createMapStorage({}, sync.push);
      recoverStorage(flaky as never, local, sync);
      local.set('fav', '2');
      await vi.advanceTimersByTimeAsync(1000);
      expect(JSON.parse(port.text as string)).toEqual({ outbox: 'queued', fav: '1' });
      failing = false;
      await vi.advanceTimersByTimeAsync(LOAD_RETRY_MS);
      for (let i = 0; i < 20; i++) await vi.advanceTimersByTimeAsync(300);
      expect(JSON.parse(port.text as string)).toEqual({ outbox: 'queued', fav: '2' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('a payload with extra keys is invalid', async () => {
    const { client } = rig(mem());
    const p = client.call('storage.write', { entries: { a: '1' }, extra: 1 } as never);
    await tick();
    expect(await p).toMatchObject({ ok: false, error: { code: 'invalid' } });
  });
});

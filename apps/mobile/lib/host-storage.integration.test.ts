import { describe, expect, it, vi } from 'vitest';
import { createBridgeClient } from '@swift2/ui';
import type { BridgeClient, Envelope } from '@swift2/ui';
import { loadStorageSeed } from '../dom/reader/storage-sync';
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

  it('a payload with extra keys is invalid', async () => {
    const { client } = rig(mem());
    const p = client.call('storage.write', { entries: { a: '1' }, extra: 1 } as never);
    await tick();
    expect(await p).toMatchObject({ ok: false, error: { code: 'invalid' } });
  });
});

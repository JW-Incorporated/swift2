import { describe, expect, it, vi } from 'vitest';
import { createHandlers } from './bridge-handlers-ui';
import { createHostStorage, MAX_BLOB_BYTES, type HostStoragePort } from './host-storage';

const ctx = { signal: new AbortController().signal };
const memPort = (initial: string | null = null): HostStoragePort & { text: string | null } => {
  const p = {
    text: initial,
    read: () => p.text,
    write: (t: string) => void (p.text = t),
  };
  return p;
};
const handlers = (port = memPort()) =>
  createHandlers({
    navigate: vi.fn(),
    isNativeRoute: () => true,
    log: vi.fn(),
    openURL: vi.fn(async () => {}),
    share: vi.fn(async () => {}),
    hostStorage: createHostStorage(port),
  });

describe('host storage blob', () => {
  it('corrupt or wrong-shaped JSON loads as {} without throwing', () => {
    for (const bad of ['{not json', '[1,2]', '"x"', 'null', '']) expect(createHostStorage(memPort(bad)).load()).toEqual({});
  });
  it('a throwing read loads as {}', () => {
    const port = {
      read: () => {
        throw new Error('io');
      },
      write: vi.fn(),
    };
    expect(createHostStorage(port).load()).toEqual({});
  });
  it('persists set/remove and a fresh instance (relaunch) reads them back', () => {
    const port = memPort();
    const a = createHostStorage(port);
    expect(a.write({ set: { a: '1', b: '2' } })).toBe(true);
    expect(a.write({ set: { c: '3' }, remove: ['a'] })).toBe(true);
    expect(createHostStorage(port).load()).toEqual({ b: '2', c: '3' });
  });
});

describe('storage handlers', () => {
  it('load returns entries; write round-trips', async () => {
    const h = handlers();
    expect(await h['storage.write']({ set: { k: 'v' } }, ctx)).toEqual({ ok: true, value: null });
    expect(await h['storage.load']({}, ctx)).toEqual({ ok: true, value: { entries: { k: 'v' } } });
  });
  it('a key over 256 chars is invalid', async () => {
    const port = memPort();
    const r = await handlers(port)['storage.write']({ set: { ['k'.repeat(257)]: 'v' } }, ctx);
    expect(r).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(port.text).toBeNull();
  });
  it('a result over 1 MiB is invalid and writes nothing', async () => {
    const port = memPort();
    const r = await handlers(port)['storage.write']({ set: { big: 'x'.repeat(MAX_BLOB_BYTES) } }, ctx);
    expect(r).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(port.text).toBeNull();
  });
  it('rejects malformed payloads', async () => {
    const h = handlers();
    expect(await h['storage.write']({ set: { k: 1 } } as never, ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(await h['storage.write']({ remove: 'k' } as never, ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
  });
});

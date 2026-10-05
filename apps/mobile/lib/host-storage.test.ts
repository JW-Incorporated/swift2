import { describe, expect, it, vi } from 'vitest';
import { createHandlers } from './bridge-handlers-ui';
import { createHostStorage, MAX_BLOB_BYTES, utf8Length, type HostStoragePort } from './host-storage';

const ctx = { signal: new AbortController().signal };
type Mem = HostStoragePort & { text: string | null; writes: { text: string; mainTrusted: boolean }[] };
const memPort = (initial: string | null = null): Mem => {
  const p: Mem = {
    text: initial,
    writes: [],
    read: () => p.text,
    write: (t, mainTrusted) => {
      p.text = t;
      p.writes.push({ text: t, mainTrusted });
    },
  };
  return p;
};
const copies = (main: string | null, tmp: string | null, bak: string | null): HostStoragePort & { writes: boolean[] } => {
  const writes: boolean[] = [];
  return { read: () => main, readTmp: () => tmp, readBackup: () => bak, write: (_t, trusted) => void writes.push(trusted), writes };
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
  it('a mixed-type main falls back to the backup', () => {
    expect(createHostStorage(copies('{"a":"1","n":2}', null, '{"a":"old"}')).load()).toEqual({ a: 'old' });
  });
  it('load order is main, tmp, then backup', () => {
    expect(createHostStorage(copies('{bad', '{"t":"1"}', '{"b":"1"}')).load()).toEqual({ t: '1' });
    expect(createHostStorage(copies('{bad', '{bad', '{"b":"1"}')).load()).toEqual({ b: '1' });
    expect(createHostStorage(copies('{"m":"1"}', '{"t":"1"}', '{"b":"1"}')).load()).toEqual({ m: '1' });
  });
  it('a main loaded from the backup is untrusted until a write succeeds', () => {
    const port = copies('{bad', null, '{"a":"1"}');
    const s = createHostStorage(port);
    expect(s.load()).toEqual({ a: '1' });
    expect(s.write({ a: '1', b: '2' })).toBe(true);
    expect(s.write({ a: '1', b: '3' })).toBe(true);
    expect(port.writes).toEqual([false, true]);
  });
  it('a main loaded from main is trusted on the first write', () => {
    const port = copies('{"a":"1"}', null, null);
    expect(createHostStorage(port).write({ a: '2' })).toBe(true);
    expect(port.writes).toEqual([true]);
  });
  it('write replaces the blob wholesale; a fresh instance (relaunch) reads it back', () => {
    const port = memPort();
    const a = createHostStorage(port);
    expect(a.write({ a: '1', b: '2' })).toBe(true);
    expect(a.write({ b: '2', c: '3' })).toBe(true);
    expect(createHostStorage(port).load()).toEqual({ b: '2', c: '3' });
  });
  it('over the cap (UTF-8 bytes) is refused and the cache and file are unchanged', () => {
    const port = memPort('{"a":"1"}');
    const s = createHostStorage(port);
    expect(s.write({ k: 'é'.repeat(MAX_BLOB_BYTES / 2) })).toBe(false);
    expect(s.load()).toEqual({ a: '1' });
    expect(port.writes).toEqual([]);
    expect(utf8Length('é')).toBe(2);
    expect(utf8Length('\u{1F600}')).toBe(4);
  });
});

describe('storage handlers', () => {
  it('load returns entries; write round-trips', async () => {
    const h = handlers();
    expect(await h['storage.write']({ entries: { k: 'v' } }, ctx)).toEqual({ ok: true, value: null });
    expect(await h['storage.load']({}, ctx)).toEqual({ ok: true, value: { entries: { k: 'v' } } });
  });
  it('a key over 256 chars is invalid', async () => {
    const port = memPort();
    const r = await handlers(port)['storage.write']({ entries: { ['k'.repeat(257)]: 'v' } }, ctx);
    expect(r).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(port.text).toBeNull();
  });
  it('a blob over the cap is invalid and writes nothing', async () => {
    const port = memPort();
    const r = await handlers(port)['storage.write']({ entries: { big: 'x'.repeat(MAX_BLOB_BYTES) } }, ctx);
    expect(r).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(port.text).toBeNull();
  });
  it('rejects malformed payloads', async () => {
    const h = handlers();
    expect(await h['storage.write']({ entries: { k: 1 } } as never, ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(await h['storage.write']({ set: { k: 'v' } } as never, ctx)).toMatchObject({ ok: false, error: { code: 'invalid' } });
  });
});

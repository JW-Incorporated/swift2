import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const disk = new Map<string, number>();
const state = { handleOpen: 0, handleClosed: 0, fallbackBytes: 0, fallbackCalls: 0, closeThrows: false };
let responder: () => Promise<unknown>;

vi.mock('react-native', () => ({ InteractionManager: { runAfterInteractions: () => {} } }));
vi.mock('./diagnostics', () => ({ diagMarkOnce: () => {} }));
vi.mock('expo/fetch', () => ({ fetch: () => responder() }));
vi.mock('expo-file-system', () => {
  class Directory {
    uri: string;
    exists = true;
    constructor(base: { uri: string } | string, name?: string) {
      this.uri = `${typeof base === 'string' ? base : base.uri}/${name ?? ''}`;
    }
    create() {}
  }
  class File {
    uri: string;
    constructor(dir: { uri: string }, name: string) {
      this.uri = `${dir.uri}/${name}`;
    }
    get exists() {
      return disk.has(this.uri);
    }
    get size() {
      return disk.get(this.uri) ?? 0;
    }
    create() {
      disk.set(this.uri, 0);
    }
    delete() {
      disk.delete(this.uri);
    }
    open() {
      state.handleOpen += 1;
      return {
        writeBytes: (b: Uint8Array) => void disk.set(this.uri, (disk.get(this.uri) ?? 0) + b.byteLength),
        close: () => {
          state.handleClosed += 1;
          if (state.closeThrows) throw new Error('close failed');
        },
      };
    }
    static async downloadFileAsync(_url: string, f: File) {
      state.fallbackCalls += 1;
      disk.set(f.uri, state.fallbackBytes);
    }
  }
  return { Directory, File, Paths: { document: { uri: 'file:///doc' } }, FileMode: { ReadOnly: 'r', WriteOnly: 'w' } };
});

import { expoArtFs } from './art-cache-fs';

const URL = 'https://www.longlivets.com/eras/a.png';
const TMP = 'a.png.tmp';

const tmpEntry = () => {
  const key = [...disk.keys()].find((k) => k.endsWith(TMP));
  return { get: () => (key === undefined ? undefined : disk.get(key)), has: () => key !== undefined };
};

function streamOf(chunks: number[], opts: { hang?: boolean } = {}) {
  const queue = [...chunks];
  const cancel = vi.fn(async () => {});
  const body = {
    getReader: () => ({
      read: (): Promise<{ done: boolean; value?: Uint8Array }> => {
        if (queue.length) return Promise.resolve({ done: false, value: new Uint8Array(queue.shift()!) });
        return opts.hang ? new Promise(() => {}) : Promise.resolve({ done: true });
      },
      cancel,
    }),
    cancel,
  };
  return { body, cancel };
}
const ok = (body: unknown) => ({ ok: true, status: 200, body });

beforeEach(() => {
  disk.clear();
  Object.assign(state, { handleOpen: 0, handleClosed: 0, fallbackBytes: 0, fallbackCalls: 0, closeThrows: false });
});
afterEach(() => vi.useRealTimers());

describe('expoArtFs().download', () => {
  it('keeps a body inside the bounds', async () => {
    const s = streamOf([1000, 2000]);
    responder = async () => ok(s.body);
    await expoArtFs().download(URL, TMP, 10_000, 2000);
    expect(tmpEntry().get()).toBe(3000);
    expect(state.handleClosed).toBe(state.handleOpen);
  });

  it('aborts an oversized body, deletes the partial file and closes the handle', async () => {
    const s = streamOf([600, 600, 600]);
    responder = async () => ok(s.body);
    await expect(expoArtFs().download(URL, TMP, 1000)).rejects.toThrow(/size cap/);
    expect(tmpEntry().has()).toBe(false);
    expect(state.handleOpen).toBe(1);
    expect(state.handleClosed).toBe(1);
    expect(s.cancel).toHaveBeenCalled();
  });

  it('cancels the body and writes nothing on a non-ok response', async () => {
    const s = streamOf([10]);
    responder = async () => ({ ok: false, status: 404, body: s.body });
    await expect(expoArtFs().download(URL, TMP, 1000)).rejects.toThrow(/404/);
    expect(s.cancel).toHaveBeenCalled();
    expect(state.handleOpen).toBe(0);
    expect(tmpEntry().has()).toBe(false);
  });

  it('rejects a body that ends short of the declared length', async () => {
    const s = streamOf([100]);
    responder = async () => ok(s.body);
    await expect(expoArtFs().download(URL, TMP, 10_000, 5000)).rejects.toThrow(/ended early/);
    expect(tmpEntry().has()).toBe(false);
  });

  it('rejects an empty body', async () => {
    const s = streamOf([]);
    responder = async () => ok(s.body);
    await expect(expoArtFs().download(URL, TMP, 10_000)).rejects.toThrow(/ended early/);
    expect(tmpEntry().has()).toBe(false);
  });

  it('fails a stalled stream after the idle timeout and deletes the partial file', async () => {
    vi.useFakeTimers();
    const s = streamOf([100], { hang: true });
    responder = async () => ok(s.body);
    const p = expoArtFs().download(URL, TMP, 10_000);
    const assertion = expect(p).rejects.toThrow(/stalled/);
    await vi.advanceTimersByTimeAsync(31_000);
    await assertion;
    expect(tmpEntry().has()).toBe(false);
    expect(state.handleClosed).toBe(1);
    expect(s.cancel).toHaveBeenCalled();
  });

  it('does not double-close the handle or mask the original error when close throws', async () => {
    state.closeThrows = true;
    const s = streamOf([600, 600]);
    responder = async () => ok(s.body);
    await expect(expoArtFs().download(URL, TMP, 1000)).rejects.toThrow(/size cap/);
    expect(state.handleClosed).toBe(1);
    expect(tmpEntry().has()).toBe(false);
  });

  it('falls back to a whole-file download when streaming is unsupported, and keeps a file inside the bounds', async () => {
    responder = async () => ok(null);
    state.fallbackBytes = 3000;
    await expoArtFs().download(URL, TMP, 10_000, 2000);
    expect(state.fallbackCalls).toBe(1);
    expect(tmpEntry().get()).toBe(3000);
  });

  it('fallback deletes an oversized file before it can be indexed', async () => {
    responder = async () => ok({});
    state.fallbackBytes = 50_000;
    await expect(expoArtFs().download(URL, TMP, 10_000)).rejects.toThrow(/size bounds/);
    expect(state.fallbackCalls).toBe(1);
    expect(tmpEntry().has()).toBe(false);
  });
});

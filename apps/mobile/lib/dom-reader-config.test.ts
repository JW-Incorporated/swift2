import { beforeEach, describe, expect, it, vi } from 'vitest';

const files = new Map<string, string>();
const ops: string[] = [];
const mtimes = new Map<string, number>();
let clock = 0;
let textReads = 0;
let failOp: string | null = null;
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
      return files.has(this.uri);
    }
    get size() {
      return (files.get(this.uri) ?? '').length;
    }
    get modificationTime() {
      return mtimes.get(this.uri) ?? null;
    }
    write(v: string) {
      ops.push(`write ${this.uri.split('/').pop()}`);
      if (failOp === 'tmp' && this.uri.endsWith('.tmp')) throw new Error('tmp write failed');
      files.set(this.uri, v);
      mtimes.set(this.uri, ++clock);
    }
    textSync() {
      textReads++;
      return files.get(this.uri) as string;
    }
    moveSync(dest: { uri: string }) {
      ops.push(`move ${this.uri.split('/').pop()}`);
      if (failOp === 'move') throw new Error('move failed');
      mtimes.set(dest.uri, ++clock);
      files.set(dest.uri, files.get(this.uri) as string);
      files.delete(this.uri);
    }
    delete() {
      files.delete(this.uri);
    }
  }
  return { Directory, File, Paths: { document: { uri: 'file:///doc' } } };
});

import { cacheFileName, lastGoodCacheKey, lastGoodSource } from './dom-reader-config';
import { contentBaseUrl, contentId, expoFileSystemStorageAdapter, lastGoodScriptSource } from './vault-storage';

const key = () => lastGoodCacheKey(contentBaseUrl());
const jsonUri = () => `file:///doc/swift2-content-cache/${cacheFileName(key())}`;
const jsUri = () => jsonUri().replace(/\.json$/, '.js');

beforeEach(() => {
  files.clear();
  mtimes.clear();
  ops.length = 0;
  textReads = 0;
  failOp = null;
  vi.useRealTimers();
});

describe('lastGoodSource', () => {
  const put = (json: string, twin: string | null) => {
    files.set(jsonUri(), json);
    mtimes.set(jsonUri(), ++clock);
    if (twin !== null) {
      files.set(jsUri(), twin);
      mtimes.set(jsUri(), ++clock);
    }
  };

  it('is null when no cache is on disk (first launch)', () => {
    expect(lastGoodSource()).toBeNull();
  });

  it('a valid pair reads neither file and uses the twin mtime as the buster', () => {
    put('{"v":1}', lastGoodScriptSource('{"v":1}'));
    const s = lastGoodSource();
    expect(s).toEqual({ scriptUri: `${jsUri()}?v=${mtimes.get(jsUri())}`, jsonUri: jsonUri() });
    expect(textReads).toBe(0);
    expect(ops).toEqual([]);
  });

  it.each([
    ['missing', null],
    ['undersized', 'x'],
  ])('a %s twin returns synchronously and is rebuilt after a tick', (_n, twin) => {
    vi.useFakeTimers();
    put('{"v":1}', twin);
    const s = lastGoodSource();
    expect(s?.jsonUri).toBe(jsonUri());
    expect(s?.scriptUri.startsWith(`${jsUri()}?v=`)).toBe(true);
    expect(ops).toEqual([]);
    expect(textReads).toBe(0);
    vi.runAllTimers();
    expect(files.get(jsUri())).toBe(lastGoodScriptSource('{"v":1}'));
  });

  it('an older twin (json newer) is rebuilt after a tick', () => {
    vi.useFakeTimers();
    const big = lastGoodScriptSource('{"v":1}');
    put('{"v":1}', big);
    mtimes.set(jsonUri(), ++clock);
    lastGoodSource();
    expect(ops).toEqual([]);
    vi.runAllTimers();
    expect(ops).toContain('move ' + jsUri().split('/').pop() + '.tmp');
  });
});

describe('storage adapter .js twin', () => {
  const payloads = ['{"a":"q\\"uote","b":"back\\\\slash","c":"  "}', '{"e":"\\u2028\\u2029"}', '{"plain":1}'];

  it.each(payloads)('writes a round-trippable .js sibling for :last-good (%#)', (json) => {
    expoFileSystemStorageAdapter().setItem(key(), json);
    const js = files.get(jsUri()) as string;
    expect(js.startsWith('globalThis.__swift2LastGood=')).toBe(true);
    const g: Record<string, unknown> = {};
    (new Function('globalThis', js) as (g: unknown) => void)(g);
    expect(g.__swift2LastGood).toBe(json);
    expect(g.__swift2LastGoodId).toBe(contentId(json));
    expect(files.get(jsonUri())).toBe(json);
  });

  it('writes the twin atomically (temp then move) after the .json', () => {
    expoFileSystemStorageAdapter().setItem(key(), '{}');
    const js = jsUri().split('/').pop();
    expect(ops).toEqual(['write ' + jsonUri().split('/').pop(), 'write ' + js + '.tmp', 'move ' + js + '.tmp']);
    expect([...files.keys()].sort()).toEqual([jsUri(), jsonUri()].sort());
  });

  it.each(['move', 'tmp'])('a twin write failure (%s) keeps the .json intact, does not throw, warns once', (op) => {
    failOp = op;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => expoFileSystemStorageAdapter().setItem(key(), '{"full":1}')).not.toThrow();
    expect(files.get(jsonUri())).toBe('{"full":1}');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('removeItem deletes the .js twin with the .json', () => {
    const a = expoFileSystemStorageAdapter();
    a.setItem(key(), '{}');
    a.removeItem?.(key());
    expect(files.size).toBe(0);
  });

  it('writes no .js for other keys', () => {
    expoFileSystemStorageAdapter().setItem('@swift2/content:v1:x:other', '{}');
    expect([...files.keys()].some((k) => k.endsWith('.js'))).toBe(false);
  });
});

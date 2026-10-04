import { beforeEach, describe, expect, it, vi } from 'vitest';

const files = new Map<string, string>();
let mtime: number | null = 1234;
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
    write(v: string) {
      files.set(this.uri, v);
    }
    get size() {
      return (files.get(this.uri) ?? "").length;
    }
    info() {
      return { modificationTime: mtime };
    }
    textSync() {
      return files.get(this.uri) as string;
    }
    delete() {
      files.delete(this.uri);
    }
  }
  return { Directory, File, Paths: { document: { uri: 'file:///doc' } } };
});

import { cacheFileName, lastGoodCacheKey, lastGoodCacheUri } from './dom-reader-config';
import { contentBaseUrl, expoFileSystemStorageAdapter, lastGoodScriptSource } from './vault-storage';

const key = () => lastGoodCacheKey(contentBaseUrl());
const jsonUri = () => `file:///doc/swift2-content-cache/${cacheFileName(key())}`;
const jsUri = () => jsonUri().replace(/\.json$/, '.js');

beforeEach(() => {
  files.clear();
  mtime = 1234;
});

describe('lastGoodCacheUri', () => {
  it('is null when no cache is on disk (first launch)', () => {
    expect(lastGoodCacheUri()).toBeNull();
  });

  it('backfills the .js twin once from an existing .json and returns its URI', () => {
    files.set(jsonUri(), '{"v":1}');
    expect(lastGoodCacheUri()).toBe(`${jsUri()}?v=1234`);
    expect(files.get(jsUri())).toBe(lastGoodScriptSource('{"v":1}'));
    files.set(jsUri(), 'sentinel');
    expect(lastGoodCacheUri()).toBe(`${jsUri()}?v=1234`);
    expect(files.get(jsUri())).toBe('sentinel');
  });

  it('falls back to the file size when there is no mtime', () => {
    mtime = null;
    files.set(jsonUri(), '{"v":1}');
    expect(lastGoodCacheUri()).toBe(`${jsUri()}?v=7`);
  });
});

describe('storage adapter .js twin', () => {
  const payloads = ['{"a":"q\\"uote","b":"back\\\\slash","c":"  "}', '{"e":"\u2028\u2029"}', '{"plain":1}'];

  it.each(payloads)('writes a round-trippable .js sibling for :last-good (%#)', (json) => {
    expoFileSystemStorageAdapter().setItem(key(), json);
    const js = files.get(jsUri()) as string;
    expect(js.startsWith('globalThis.__swift2LastGood=')).toBe(true);
    expect(js.endsWith(';')).toBe(true);
    const g: Record<string, unknown> = {};
    (new Function('globalThis', js) as (g: unknown) => void)(g);
    expect(g.__swift2LastGood).toBe(json);
    expect(files.get(jsonUri())).toBe(json);
  });

  it('removeItem deletes the .js twin with the .json', () => {
    const a = expoFileSystemStorageAdapter();
    a.setItem(key(), '{}');
    a.removeItem?.(key());
    expect(files.size).toBe(0);
  });

  it('writes the .js twin before the .json', () => {
    expoFileSystemStorageAdapter().setItem(key(), '{}');
    expect([...files.keys()]).toEqual([jsUri(), jsonUri()]);
  });

  it('writes no .js for other keys', () => {
    expoFileSystemStorageAdapter().setItem('@swift2/content:v1:x:other', '{}');
    expect([...files.keys()].some((k) => k.endsWith('.js'))).toBe(false);
  });
});

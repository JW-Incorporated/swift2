import { beforeEach, describe, expect, it, vi } from 'vitest';

const files = new Map<string, string>();
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

beforeEach(() => files.clear());

describe('lastGoodCacheUri', () => {
  it('is null when no cache is on disk (first launch)', () => {
    expect(lastGoodCacheUri()).toBeNull();
  });

  it('backfills the .js twin once from an existing .json and returns its URI', () => {
    files.set(jsonUri(), '{"v":1}');
    expect(lastGoodCacheUri()).toBe(jsUri());
    expect(files.get(jsUri())).toBe(lastGoodScriptSource('{"v":1}'));
    files.set(jsUri(), 'sentinel');
    expect(lastGoodCacheUri()).toBe(jsUri());
    expect(files.get(jsUri())).toBe('sentinel');
  });
});

describe('storage adapter .js twin', () => {
  const payloads = ['{"a":"q\\"uote","b":"back\\\\slash","c":"  "}', '{"plain":1}'];

  it.each(payloads)('writes a round-trippable .js sibling for :last-good (%#)', (json) => {
    expoFileSystemStorageAdapter().setItem(key(), json);
    const js = files.get(jsUri()) as string;
    expect(js.startsWith('globalThis.__swift2LastGood=')).toBe(true);
    expect(js.endsWith(';')).toBe(true);
    const g: Record<string, unknown> = {};
    new Function('globalThis', js)(g);
    expect(g.__swift2LastGood).toBe(json);
    expect(files.get(jsonUri())).toBe(json);
  });

  it('writes no .js for other keys', () => {
    expoFileSystemStorageAdapter().setItem('@swift2/content:v1:x:other', '{}');
    expect([...files.keys()].some((k) => k.endsWith('.js'))).toBe(false);
  });
});

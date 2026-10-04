import { beforeEach, describe, expect, it, vi } from 'vitest';

const files = new Map<string, string>();
const ops: string[] = [];
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
      ops.push(`write ${this.uri.split('/').pop()}`);
      files.set(this.uri, v);
    }
    textSync() {
      return files.get(this.uri) as string;
    }
    moveSync(dest: { uri: string }) {
      ops.push(`move ${this.uri.split('/').pop()}`);
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
  ops.length = 0;
});

describe('lastGoodSource', () => {
  it('is null when no cache is on disk (first launch)', () => {
    expect(lastGoodSource()).toBeNull();
  });

  it('backfills a missing .js twin and returns separate script (?v=id) and json URIs', () => {
    files.set(jsonUri(), '{"v":1}');
    expect(lastGoodSource()).toEqual({ scriptUri: `${jsUri()}?v=${contentId('{"v":1}')}`, jsonUri: jsonUri() });
    expect(files.get(jsUri())).toBe(lastGoodScriptSource('{"v":1}'));
  });

  it('leaves a valid twin untouched', () => {
    files.set(jsonUri(), '{"v":1}');
    files.set(jsUri(), lastGoodScriptSource('{"v":1}'));
    lastGoodSource();
    expect(ops).toEqual([]);
  });

  it('regenerates a stale twin (older content) and changes the ?v= id', () => {
    files.set(jsonUri(), '{"v":2}');
    files.set(jsUri(), lastGoodScriptSource('{"v":1}'));
    const s = lastGoodSource();
    expect(files.get(jsUri())).toBe(lastGoodScriptSource('{"v":2}'));
    expect(s?.scriptUri.endsWith(`?v=${contentId('{"v":2}')}`)).toBe(true);
    expect(contentId('{"v":2}')).not.toBe(contentId('{"v":1}'));
  });

  it('regenerates a truncated twin', () => {
    files.set(jsonUri(), '{"v":1}');
    files.set(jsUri(), lastGoodScriptSource('{"v":1}').slice(0, 30));
    lastGoodSource();
    expect(files.get(jsUri())).toBe(lastGoodScriptSource('{"v":1}'));
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

  it('writes the twin atomically (temp then move) and before the .json', () => {
    expoFileSystemStorageAdapter().setItem(key(), '{}');
    expect(ops).toEqual(['write ' + jsUri().split('/').pop() + '.tmp', 'move ' + jsUri().split('/').pop() + '.tmp', 'write ' + jsonUri().split('/').pop()]);
    expect([...files.keys()].sort()).toEqual([jsUri(), jsonUri()].sort());
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

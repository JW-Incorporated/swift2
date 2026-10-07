/** vault-storage: content-cache writes are atomic (temp + move) and stray temps are swept. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fsState = vi.hoisted(() => ({
  files: new Map<string, string>(),
  crashAfterTmpWrite: false,
}));

vi.mock('expo-file-system', () => {
  class FakeFile {
    constructor(
      private dir: { path: string },
      public name: string,
    ) {}
    private get id() {
      return `${this.dir.path}/${this.name}`;
    }
    get exists() {
      return fsState.files.has(this.id);
    }
    textSync() {
      return fsState.files.get(this.id) ?? '';
    }
    write(v: string) {
      fsState.files.set(this.id, v);
    }
    delete() {
      fsState.files.delete(this.id);
    }
    moveSync(to: FakeFile, _o?: unknown) {
      if (fsState.crashAfterTmpWrite) throw new Error('killed mid-write');
      fsState.files.set(to.id, fsState.files.get(this.id) ?? '');
      fsState.files.delete(this.id);
    }
  }
  class FakeDirectory {
    path: string;
    constructor(parent: { path?: string }, name?: string) {
      this.path = `${parent.path ?? ''}/${name ?? ''}`;
    }
    exists = true;
    create() {}
    list() {
      return [...fsState.files.keys()]
        .filter((k) => k.startsWith(`${this.path}/`))
        .map((k) => ({ name: k.slice(this.path.length + 1) }));
    }
  }
  return { File: FakeFile, Directory: FakeDirectory, Paths: { document: { path: '/doc' } } };
});

const importAdapter = async () => {
  vi.resetModules();
  const mod = await import('./vault-storage');
  return mod.expoFileSystemStorageAdapter();
};

beforeEach(() => {
  fsState.files.clear();
  fsState.crashAfterTmpWrite = false;
});

describe('expoFileSystemStorageAdapter atomic writes', () => {
  it('round-trips a value and leaves no temp file behind', async () => {
    const adapter = await importAdapter();
    adapter.setItem('k', '{"a":1}');
    expect(adapter.getItem('k')).toBe('{"a":1}');
    expect([...fsState.files.keys()].some((k) => k.endsWith('.tmp'))).toBe(false);
  });

  it('a crash mid-write leaves the previous file intact and cleans its temp', async () => {
    const adapter = await importAdapter();
    adapter.setItem('k', '{"old":true}');
    fsState.crashAfterTmpWrite = true;
    expect(() => adapter.setItem('k', '{"new":tru')).toThrow('killed mid-write');
    expect(adapter.getItem('k')).toBe('{"old":true}');
    expect([...fsState.files.keys()].some((k) => k.endsWith('.tmp'))).toBe(false);
  });

  it('a process killed before cleanup leaves a stray temp; the next process sweeps it, previous file intact', async () => {
    const adapter = await importAdapter();
    adapter.setItem('k', '{"old":true}');
    fsState.files.set('/doc/swift2-content-cache/k.json.tmp', '{"trunc');
    const next = await importAdapter();
    next.setItem('other', '1');
    expect(fsState.files.has('/doc/swift2-content-cache/k.json.tmp')).toBe(false);
    expect(next.getItem('k')).toBe('{"old":true}');
  });
});

/**
 * `packages/content` storage adapter contract (OS-013, `docs/specs/2026-09-05-
 * one-source-three-surfaces.md` §2, Layer 1).
 *
 * The loader (`./load.ts`) is runtime-agnostic: it never touches `localStorage`,
 * `expo-file-system`, or any other platform API directly. Instead every caller
 * injects a `StorageAdapter` — a plain string-keyed get/set/remove contract —
 * so the SAME loader works:
 *
 *  - on the web at build time with no storage at all (`createNullStorageAdapter()`,
 *    every load is a cold network load, nothing persists between runs — that's
 *    correct for a `next build`/`next start` process);
 *  - on mobile (OS-015) with an adapter backed by `expo-file-system`, giving the
 *    loader a durable "last-good" bundle it can fall back to with the network off;
 *  - in tests with `MemoryStorageAdapter`, a process-local Map.
 *
 * Methods may return their value synchronously or as a Promise — the loader
 * always `await`s them, so either shape works without every adapter needing to
 * be `async`.
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem?(key: string): Promise<void> | void;
}

/** In-memory adapter: durable for the lifetime of the process, nowhere else. Used by tests and as the loader's default when no adapter is supplied. */
export class MemoryStorageAdapter implements StorageAdapter {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  /** Test/debug escape hatch — not part of the StorageAdapter contract. */
  size(): number {
    return this.store.size;
  }
}

/** Adapter that persists nothing: every `getItem` misses, every `setItem` is a no-op. Matches OS-013's "web: none at build time" requirement explicitly rather than leaving `storage` undefined. */
export function createNullStorageAdapter(): StorageAdapter {
  return {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  };
}

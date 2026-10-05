// The reader's persistent `local` storage (website localStorage parity): ONE JSON blob under Paths.document, which
// survives OTA updates (the update bundle dir does not). Pure core (file port in host-storage-file.ts) so it is testable under node.

export const MAX_KEY_LENGTH = 256;
export const MAX_BLOB_BYTES = 1024 * 1024;

export type HostStoragePort = { read(): string | null; write(text: string): void };
export type HostStorage = {
  load(): Record<string, string>;
  /** false = refused (the resulting blob would exceed the cap); nothing was written. Throws only on an I/O failure. */
  write(change: { set?: Record<string, string>; remove?: string[] }): boolean;
};

function parse(text: string | null): Record<string, string> {
  if (!text) return {};
  try {
    const v: unknown = JSON.parse(text);
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return {};
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(v)) if (typeof val === 'string') out[k] = val;
    return out;
  } catch {
    return {};
  }
}

export function createHostStorage(port: HostStoragePort): HostStorage {
  let cache: Record<string, string> | null = null;
  const current = (): Record<string, string> => {
    if (cache) return cache;
    let text: string | null;
    try {
      text = port.read();
    } catch {
      text = null;
    }
    return (cache = parse(text));
  };
  return {
    load: () => ({ ...current() }),
    write({ set, remove }) {
      const next = { ...current() };
      for (const k of remove ?? []) delete next[k];
      for (const [k, v] of Object.entries(set ?? {})) next[k] = v;
      const text = JSON.stringify(next);
      if (text.length > MAX_BLOB_BYTES) return false;
      port.write(text);
      cache = next;
      return true;
    },
  };
}

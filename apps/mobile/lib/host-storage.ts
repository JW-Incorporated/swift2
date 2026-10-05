// The reader's persistent `local` storage (website localStorage parity): ONE JSON blob under Paths.document, which
// survives OTA updates (the update bundle dir does not). Pure core (file port in host-storage-file.ts) so it is testable under node.

export const MAX_KEY_LENGTH = 256;
/** Under the 256 KiB bridge envelope cap (packages/ui/src/bridge/validate.ts), measured in UTF-8 bytes. */
export const MAX_BLOB_BYTES = 192 * 1024;

/** UTF-8 byte length without relying on TextEncoder being present in the JS engine. */
export function utf8Length(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length && (s.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      n += 4;
      i++;
    } else n += 3;
  }
  return n;
}

export type HostStoragePort = {
  read(): string | null;
  readTmp?(): string | null;
  readBackup?(): string | null;
  /** `mainTrusted`: the current main file is known-good, so it may replace the backup. */
  write(text: string, mainTrusted: boolean): void;
};
export type HostStorage = {
  load(): Record<string, string>;
  /** Replaces the whole blob. false = refused (over the cap); nothing was written, the cache is unchanged. Throws only on an I/O failure. */
  write(entries: Record<string, string>): boolean;
};

/** null = missing, corrupt, or not an object whose every value is a string (so the caller can try the next copy). */
function parse(text: string | null): Record<string, string> | null {
  if (!text) return null;
  try {
    const v: unknown = JSON.parse(text);
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(v)) {
      if (typeof val !== 'string') return null;
      out[k] = val;
    }
    return out;
  } catch {
    return null;
  }
}

export function createHostStorage(port: HostStoragePort): HostStorage {
  let cache: Record<string, string> | null = null;
  let mainTrusted = false;
  const attempt = (read?: () => string | null) => {
    try {
      return parse(read ? read() : null);
    } catch {
      return null;
    }
  };
  const current = (): Record<string, string> => {
    if (cache) return cache;
    const main = attempt(port.read);
    if (main) mainTrusted = true;
    return (cache = main ?? attempt(port.readTmp?.bind(port)) ?? attempt(port.readBackup?.bind(port)) ?? {});
  };
  return {
    load: () => ({ ...current() }),
    write(entries) {
      current();
      const next = { ...entries };
      const text = JSON.stringify(next);
      if (utf8Length(text) > MAX_BLOB_BYTES) return false;
      port.write(text, mainTrusted);
      mainTrusted = true;
      cache = next;
      return true;
    },
  };
}

import { READER_SNAPSHOT_DOMAIN_NAMES, type ReaderSnapshot, type ReaderSnapshotDomainName } from './types';

/**
 * Canonical JSON: object keys sorted, `undefined` object members dropped
 * (and `undefined` array members written as null), exactly as a JSON
 * round-trip through the bundle would leave them. Non-finite numbers and
 * non-plain values throw rather than hash differently on each side.
 */
export function canonicalize(value: unknown): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return JSON.stringify(value);
    case 'number':
      if (!Number.isFinite(value)) throw new Error(`canonicalize: non-finite number ${value}`);
      return JSON.stringify(value);
    case 'object': {
      if (Array.isArray(value)) {
        return `[${value.map((v) => (v === undefined ? 'null' : canonicalize(v))).join(',')}]`;
      }
      const proto = Object.getPrototypeOf(value);
      if (proto !== Object.prototype && proto !== null) {
        throw new Error('canonicalize: only plain objects and arrays are hashable');
      }
      const obj = value as Record<string, unknown>;
      const parts = Object.keys(obj)
        .sort()
        .filter((k) => obj[k] !== undefined)
        .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`);
      return `{${parts.join(',')}}`;
    }
    default:
      throw new Error(`canonicalize: unsupported ${typeof value}`);
  }
}

/**
 * SHA-256 hex of canonical JSON via WebCrypto (`crypto.subtle`: Node 18+,
 * browsers, the webview). There is no pure-JS fallback on purpose: the
 * snapshot is built in the DOM/webview, never in Hermes.
 */
export async function hashValue(value: unknown): Promise<string> {
  const subtle = (globalThis.crypto as Crypto | undefined)?.subtle;
  if (!subtle) throw new Error('hashValue: WebCrypto (crypto.subtle) is unavailable in this runtime');
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(canonicalize(value)));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface ReaderSnapshotHash {
  /** Over `{ version, domains }`. `state` and `origin` are excluded. */
  hash: string;
  domains: Record<ReaderSnapshotDomainName, string>;
}

/** Throws on a snapshot missing any domain: a core-only snapshot must never be hashed. */
export async function hashSnapshot(snapshot: ReaderSnapshot): Promise<ReaderSnapshotHash> {
  const missing = READER_SNAPSHOT_DOMAIN_NAMES.filter((n) => snapshot.domains[n] === undefined);
  if (missing.length > 0) throw new Error(`hashSnapshot: snapshot is missing domains: ${missing.join(', ')}`);
  const names = Object.keys(snapshot.domains).sort() as ReaderSnapshotDomainName[];
  const entries = await Promise.all(names.map(async (n) => [n, await hashValue(snapshot.domains[n])] as const));
  const domains = Object.fromEntries(entries) as Record<ReaderSnapshotDomainName, string>;
  const hash = await hashValue({ version: snapshot.version, domains });
  return { hash, domains };
}

/** Domains whose hashes differ, by name; empty when the snapshots are equivalent. */
export async function diffSnapshots(a: ReaderSnapshot, b: ReaderSnapshot): Promise<ReaderSnapshotDomainName[]> {
  const [ha, hb] = await Promise.all([hashSnapshot(a), hashSnapshot(b)]);
  const names = new Set([...Object.keys(ha.domains), ...Object.keys(hb.domains)]) as Set<ReaderSnapshotDomainName>;
  return [...names].filter((n) => ha.domains[n] !== hb.domains[n]).sort();
}

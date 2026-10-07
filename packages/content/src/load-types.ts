/**
 * Public types, error classes and constants of the `load.ts` loader, split out
 * of it (300-line limit). `load.ts` re-exports everything public from here.
 */
import { z } from 'zod';
import type { Manifest } from './schema';
import type { StorageAdapter } from './cache';
import { CURRENT_SCHEMA_VERSION } from './compat';

/** Re-exported for anyone importing `SUPPORTED_SCHEMA_VERSION` from `./load` directly. Delegates to `./compat`'s `CURRENT_SCHEMA_VERSION` (OS-041) — the single source of truth for the schemaVersion this loader build targets, including its N-1 compatibility window. */
export const SUPPORTED_SCHEMA_VERSION = CURRENT_SCHEMA_VERSION;

/** Minimal subset of the standard `Response` shape the loader needs — satisfied by the global `fetch` in browsers, Node 18+, and Expo, and trivially fakeable in tests. */
export interface FetchResponseLike {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  headers: { get(name: string): string | null };
}

export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string>; signal?: AbortSignal },
) => Promise<FetchResponseLike>;

export interface LoadBundleOptions {
  /** Where the bundle is published, e.g. `https://www.longlivets.com/content` or a Supabase Storage bucket URL. No trailing slash required. */
  baseUrl: string;
  /** Injectable fetch implementation. Defaults to `globalThis.fetch`. */
  fetch?: FetchLike;
  /** Per-request network timeout in ms (default 30 000). A stalled request rejects as a transport failure instead of hanging forever. */
  requestTimeoutMs?: number;
  /** Injectable storage adapter. Defaults to an in-memory adapter (durable for this process only). Pass a real adapter (e.g. `expo-file-system`-backed on mobile) to persist a last-good bundle across app restarts. */
  storage?: StorageAdapter;
  /** Schema version this loader build supports. Defaults to `SUPPORTED_SCHEMA_VERSION`; override only in tests. */
  schemaVersion?: number;
  /**
   * `'reject'` (default): an unknown enum value or manifest entry fails the load.
   * `'drop'` (installed apps): unknown enum values are pruned via
   * `pruneUnknownEnumValues` and manifest entries with no schema in this build
   * are skipped; both are listed on `skipped`. See docs/decisions.md 2026-10-01.
   */
  unknownEnumPolicy?: 'reject' | 'drop';
  /**
   * `'throw'` (default): a data error always throws. `'last-good'`: a data
   * error (see `isDataError`) serves the cached last-good bundle with
   * `source: 'last-good-after-data-error'` and the error on `dataError`;
   * still throws when nothing is cached.
   */
  dataErrorFallback?: 'throw' | 'last-good';
}

export type BundleFiles = Record<string, unknown>;

export const LOAD_SOURCE = {
  network: 'network',
  cacheEtag: 'cache-etag',
  offlineLastGood: 'offline-last-good',
  lastGoodAfterDataError: 'last-good-after-data-error',
} as const;

export type LoadSource = (typeof LOAD_SOURCE)[keyof typeof LOAD_SOURCE];

export interface LoadedBundle {
  manifest: Manifest;
  /** Manifest entry name -> the file's content, already zod-validated. */
  files: BundleFiles;
  source: LoadSource;
  /** True when this bundle was served from the last-good cache (transport failure, or a data error under `dataErrorFallback: 'last-good'`), not freshly confirmed current. */
  stale: boolean;
  /** The data error that made this load fall back (`source: 'last-good-after-data-error'` only). */
  dataError?: Error;
  /** Manifest entries left out under `unknownEnumPolicy: 'drop'` (no schema in this build, or the whole file held an unknown value). */
  skipped?: string[];
}

export class BundleLoadError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'BundleLoadError';
  }
}

export class SchemaVersionMismatchError extends Error {
  constructor(
    readonly found: number,
    readonly supported: number,
    cause?: unknown,
  ) {
    super(
      `Content bundle schemaVersion ${found} is not supported by this build (this loader ` +
        `supports schemaVersion ${supported}, plus its N-1 window per OS-041's compatibility ` +
        `policy — see ./compat.ts). Ship a build whose packages/content loader understands ` +
        `schemaVersion ${found} before publishing a bundle at that version.` +
        (cause instanceof Error ? ` (${cause.message})` : ''),
    );
    this.name = 'SchemaVersionMismatchError';
  }
}

export class BundleIntegrityError extends Error {
  constructor(
    readonly fileName: string,
    detail: string,
  ) {
    super(`Content bundle file "${fileName}" failed integrity check: ${detail}`);
    this.name = 'BundleIntegrityError';
  }
}

/**
 * Marks a failure as transport-level (unreachable server, network throw, or a
 * non-2xx/non-304 HTTP status) — the ONLY category of failure that may fall
 * back to a cached last-good bundle. Anything else (JSON parse errors, zod
 * validation, integrity mismatches, schema version mismatches) is a data
 * problem with a genuinely reachable response and must never be silently
 * papered over by stale-while-revalidate.
 */
export class TransportError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'TransportError';
  }
}

/** A problem in data the server actually returned (never a transport failure) — the only errors `dataErrorFallback: 'last-good'` may absorb. */
export function isDataError(err: unknown): err is Error {
  return (
    err instanceof SchemaVersionMismatchError ||
    err instanceof BundleIntegrityError ||
    err instanceof SyntaxError ||
    err instanceof z.ZodError
  );
}

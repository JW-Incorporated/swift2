import { isDevicePrefsResponse } from '@swift2/shared';
import { canonicalize, checkParsedJson } from './validate';
import type { JsonValue } from './envelope';
import type { DomCommandType } from './messages';

export const DEFAULT_TIMEOUT_MS = 8000;
export const MAX_PENDING = 64;
export const MAX_BATCH = 64;
/** Total inbox entries retained across consumes; beyond it the oldest are dropped. */
export const MAX_RETAINED = 1024;
export const READY_BACKOFF_START_MS = 250;
export const READY_BACKOFF_CAP_MS = 5000;
export const READY_MAX_ATTEMPTS = 6;
const STATUSES: readonly unknown[] = ['granted', 'denied', 'undetermined', 'unsupported'];

export const isRec = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
export const isThenable = (x: unknown): x is PromiseLike<unknown> => isRec(x) && typeof x.then === 'function';

/** Drop `undefined`-valued keys (optional fields) so the strict-JSON check sees the wire shape. */
function strip(x: unknown, depth = 0): unknown {
  if (depth > 40) return x;
  if (Array.isArray(x)) return x.map((v) => strip(v, depth + 1));
  if (!isRec(x)) return x;
  const proto = Object.getPrototypeOf(x);
  if (proto !== Object.prototype && proto !== null) return x;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(x)) if (x[k] !== undefined) out[k] = strip(x[k], depth + 1);
  return out;
}

export function clean(x: unknown): { ok: true; value: JsonValue } | { ok: false; reason: string } {
  try {
    const v = strip(x);
    const walked = checkParsedJson(v);
    if (!walked.ok) return walked;
    const sized = canonicalize(v);
    return sized.ok ? walked : sized;
  } catch {
    return { ok: false, reason: 'bad-json' };
  }
}

export function resultFits(type: DomCommandType, v: unknown): boolean {
  if (type === 'notifications.status' || type === 'notifications.request') return STATUSES.includes(v);
  if (type === 'notifications.getPrefs' || type === 'notifications.savePrefs') return isDevicePrefsResponse(v);
  if (type === 'notifications.registration') return isRec(v) && typeof v.registered === 'boolean' && Object.keys(v).length === 1;
  if (type === 'notifications.onboardingOffered') return isRec(v) && typeof v.offered === 'boolean' && Object.keys(v).length === 1;
  if (type === 'api') {
    if (!isRec(v) || typeof v.status !== 'number' || !isRec(v.headers) || !Object.values(v.headers).every((h) => typeof h === 'string')) return false;
    if (Object.keys(v).length !== 3) return false;
    return typeof v.body === 'string' !== (typeof v.streamId === 'string');
  }
  if (type === 'storage.load') return isRec(v) && Object.keys(v).length === 1 && isRec(v.entries) && Object.values(v.entries).every((e) => typeof e === 'string');
  if (type === 'apiRead') return isRec(v) && typeof v.chunk === 'string' && typeof v.done === 'boolean' && Object.keys(v).length === 2;
  if (type === 'share') return v === null || (isRec(v) && typeof v.imageCopied === 'boolean' && Object.keys(v).length === 1);
  return v === null;
}

/** A host hwm we will reseed from: finite integer, 0 <= hwm < MAX_SAFE_INTEGER - 1. */
export const validHwm = (h: unknown): h is number =>
  typeof h === 'number' && Number.isFinite(h) && Number.isInteger(h) && h >= 0 && h < Number.MAX_SAFE_INTEGER - 1;

export type IdSource = (() => string) & {
  /** Raise the next id to at least `min` (never lowers it). */
  reseed?(min: number): void;
};

/**
 * Strictly increasing integer ids as digit strings, starting at `seed`. Throws
 * once an id would reach MAX_SAFE_INTEGER (the client treats that as fatal).
 */
export function monotonicIds(seed: number): IdSource {
  let next = Math.max(0, Math.floor(seed));
  const gen: IdSource = () => {
    if (!(next < Number.MAX_SAFE_INTEGER)) throw new RangeError('bridge id space exhausted');
    return String(next++);
  };
  gen.reseed = (min) => {
    if (min > next) next = Math.floor(min);
  };
  return gen;
}

export function readyBackoff(failures: number): number {
  return Math.min(READY_BACKOFF_CAP_MS, READY_BACKOFF_START_MS * 2 ** (failures - 1));
}

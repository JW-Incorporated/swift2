/**
 * Bridge versioning (One UI WP2.3-A).
 *
 * Rules:
 * - Add-only within a major: new message types and new optional payload
 *   fields never bump the version.
 * - An unknown `type` on a `cmd` gets `res {ok:false, error:{code:'unsupported'}}`,
 *   never a throw. An unknown `evt` type is ignored.
 * - Removing or renaming a type, or changing a payload field's type, bumps
 *   `BRIDGE_VERSION` and the host's range `max`.
 *
 * The host's `{min,max}` range is a JS constant in the app (the DOM bundle
 * ships in the same OTA group); no native config carries it.
 */
import { canonicalize } from './validate';

export const BRIDGE_VERSION = 1;

export type VersionRange = { min: number; max: number };

/** The range the native host supports (JS constant; no native config carries it). */
export const NATIVE_SUPPORTED_RANGE: VersionRange = { min: 1, max: BRIDGE_VERSION };

export type NegotiateResult = { ok: true } | { ok: false; reason: 'too-old' | 'too-new' | 'invalid' };

const isVersion = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0;

/** Canonicalizes first (never throws), then validates; returns a clean copy or null. */
function toRange(r: unknown): VersionRange | null {
  const c = canonicalize(r);
  if (!c.ok || typeof c.value !== 'object' || c.value === null || Array.isArray(c.value)) return null;
  const { min, max } = c.value as { min?: unknown; max?: unknown };
  return isVersion(min) && isVersion(max) && min <= max ? { min, max } : null;
}

export const isVersionRange = (r: unknown): r is VersionRange => toRange(r) !== null;

export function inRange(v: number, range: VersionRange): boolean {
  const r = toRange(range);
  return isVersion(v) && r !== null && v >= r.min && v <= r.max;
}

/** Fails closed: a non-integer/NaN/negative `domV` or an invalid range is `invalid`. */
export function negotiate(domV: number, hostRange: VersionRange): NegotiateResult {
  const r = toRange(hostRange);
  if (!isVersion(domV) || r === null) return { ok: false, reason: 'invalid' };
  if (domV < r.min) return { ok: false, reason: 'too-old' };
  if (domV > r.max) return { ok: false, reason: 'too-new' };
  return { ok: true };
}

/**
 * Validates a `ready` event payload. `range` is the DOM's own supported range;
 * ABSENT means "the DOM only speaks `v`" (treated as `{min:v,max:v}`).
 */
export function parseReady(p: unknown): { v: number; range?: VersionRange } | null {
  const c = canonicalize(p);
  if (!c.ok || typeof c.value !== 'object' || c.value === null || Array.isArray(c.value)) return null;
  const { v, range } = c.value as { v?: unknown; range?: unknown };
  if (!isVersion(v)) return null;
  if (range === undefined) return { v };
  const r = toRange(range);
  return r ? { v, range: r } : null;
}

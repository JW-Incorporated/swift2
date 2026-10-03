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
export const BRIDGE_VERSION = 1;

export type VersionRange = { min: number; max: number };

export type NegotiateResult = { ok: true } | { ok: false; reason: 'too-old' | 'too-new' };

export const inRange = (v: number, range: VersionRange): boolean => v >= range.min && v <= range.max;

export function negotiate(domV: number, hostRange: VersionRange): NegotiateResult {
  if (domV < hostRange.min) return { ok: false, reason: 'too-old' };
  if (domV > hostRange.max) return { ok: false, reason: 'too-new' };
  return { ok: true };
}

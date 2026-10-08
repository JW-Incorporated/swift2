/**
 * Shared best-effort per-instance per-IP rate limiter + honeypot check,
 * extracted from the 11 near-identical copies that had accumulated across
 * the public API routes (Fable 5.1 architecture review, PR #3709, task R2).
 *
 * Same posture every copy already documented: serverless instances are
 * ephemeral, so this blunts bursts on a warm instance rather than being a
 * hard security guarantee — see each route's own header for why a stronger
 * guarantee (shared KV/Redis/Postgres-backed limiter, or a real WAF) is out
 * of scope here. `client-ip.ts`'s `trustedClientIp` is what makes the IP key
 * itself trustworthy (#1973); this module only tracks hit counts per key.
 */

import { createHash, timingSafeEqual } from 'node:crypto';

export interface RateLimiterOptions {
  /** Sliding window size in milliseconds. */
  windowMs: number;
  /** Max hits allowed inside the window before a key is rate-limited. */
  max: number;
  /**
   * Optional periodic sweep interval (ms). When set, stale keys (every
   * timestamp older than `windowMs`) are dropped at most once per interval,
   * so a limiter that sees many one-off IPs doesn't grow its map forever
   * (submit-link's original fix). Omit for routes that never needed this —
   * behavior is identical to before, just without the sweep.
   */
  sweepIntervalMs?: number;
}

export interface RateLimiter {
  /** Records a hit for `key` and returns whether it is now over the limit. */
  isLimited(key: string): boolean;
  /** Current number of tracked keys — test-only introspection. */
  size(): number;
}

/** `makeRateLimiter({windowMs, max})` — one shared sliding-window limiter
 * factory for every route below (Fable 5.1 review, task R2). */
export function makeRateLimiter({ windowMs, max, sweepIntervalMs }: RateLimiterOptions): RateLimiter {
  const hits = new Map<string, number[]>();
  let lastSweep = Date.now();

  function sweepExpired(now: number): void {
    for (const [key, timestamps] of hits) {
      if (timestamps.every((t) => now - t >= windowMs)) hits.delete(key);
    }
  }

  return {
    isLimited(key: string): boolean {
      const now = Date.now();
      if (sweepIntervalMs !== undefined && now - lastSweep > sweepIntervalMs) {
        sweepExpired(now);
        lastSweep = now;
      }
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      recent.push(now);
      hits.set(key, recent);
      return recent.length > max;
    },
    size(): number {
      return hits.size;
    },
  };
}

/** Bots fill hidden form fields; a human never does. Every honeypot field in
 * this repo is optional client input, so anything truthy trips it. */
export function isHoneypotTripped(hp: unknown): boolean {
  return typeof hp === 'string' && hp.length > 0;
}

/** Constant-time secret comparison. Both sides are hashed first so the
 * comparison is length-independent (`timingSafeEqual` throws on unequal
 * lengths, and bailing early on length would leak it). */
export function timingSafeSecretEqual(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Token from an `Authorization: Bearer <token>` header, or null. Scheme is
 * case-insensitive and extra spaces are tolerated. A present-but-wrong Bearer
 * token is returned as-is; callers must NOT fall back to another credential
 * source (e.g. ?secret=) on mismatch. */
export function bearerToken(req: Request): string | null {
  const header = req.headers.get('authorization');
  if (!header) return null;
  const match = /^bearer +(\S.*?) *$/i.exec(header);
  return match ? match[1] : null;
}

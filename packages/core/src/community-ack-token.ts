// Community Engine Phase 1 card P1-5 (docs/proposals/2026-09-06-community-engine-plan.md
// §2.6): HMAC token minting + verification for the one-click "Posted"/"Skip"
// links `community-mailer.yml` (P1-6) will embed in the daily Community
// Tasks email — `https://longlivets.com/api/community/ack?lead=<id>&action=
// <posted|skip>&token=<hmac>`.
//
// Server-only (node:crypto) — never import from a client bundle. Uses
// `COMMUNITY_ACK_SECRET`, a generated-not-third-party secret per the plan's
// §4 workflow table ("HMAC; generated, not a third-party key"), independent
// of the Supabase service-role key so a leaked mailer secret can be rotated
// without touching database credentials.
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface AckTokenPayload {
  leadId: string;
  action: 'posted' | 'skip';
}

/**
 * HMAC-SHA256 over `${leadId}:${action}`, hex-encoded. Deterministic (no
 * nonce/expiry) by design — the mailer mints one token per lead+action pair
 * once, embeds it in a static email, and the token must still verify
 * whenever the founder eventually clicks it (hours to days later, same as
 * `notifications/open`'s unguessable-token posture). Tampering with either
 * the `lead` or `action` query param invalidates the signature because both
 * are part of the signed payload.
 */
export function signAckToken(secret: string, payload: AckTokenPayload): string {
  return createHmac('sha256', secret).update(`${payload.leadId}:${payload.action}`).digest('hex');
}

/**
 * Constant-time comparison against a freshly computed signature — never a
 * plain `===` on attacker-controlled input (timing side channel on a
 * public, unauthenticated GET endpoint). Returns false (never throws) for
 * malformed hex so callers can treat it as a simple boolean gate.
 */
export function verifyAckToken(secret: string, payload: AckTokenPayload, token: string): boolean {
  const expected = signAckToken(secret, payload);
  const expectedBuf = Buffer.from(expected, 'hex');
  const gotBuf = Buffer.from(token, 'hex');
  if (expectedBuf.length !== gotBuf.length) return false;
  return timingSafeEqual(expectedBuf, gotBuf);
}

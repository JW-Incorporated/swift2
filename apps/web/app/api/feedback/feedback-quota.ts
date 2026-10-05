// Durable global + per-IP quotas for the public feedback/diag writer (#5097).
// The in-memory limiters in route.ts/diag.ts only hold per serverless
// instance; this claims a slot in Postgres (claim_feedback_slot, one atomic
// function). If the function is missing (migration not applied) or Supabase
// isn't configured, it reports 'unavailable' and the caller keeps relying on
// the in-memory limits.
import { createHash } from 'node:crypto';

import { supabaseAdmin } from '../../../lib/supabase-server';

export type QuotaKind = 'feedback' | 'diag';
export type QuotaResult = 'ok' | 'ip_capped' | 'global_capped' | 'unavailable';

// A diag speed run is up to 31 reports, hence the roomier diag per-IP cap.
export const QUOTA_CAPS: Record<QuotaKind, { ip: number; global: number }> = {
  feedback: { ip: 5, global: 200 },
  diag: { ip: 60, global: 1000 },
};

// Optional FEEDBACK_QUOTA_SALT env; otherwise this constant pepper. It is NOT
// a secret: it only keeps the stored hash from being a bare sha256(ip).
const DEFAULT_PEPPER = 'longlive-feedback-quota-v1';

export function hashIp(ip: string): string {
  const salt = process.env.FEEDBACK_QUOTA_SALT || DEFAULT_PEPPER;
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

export async function claimFeedbackSlot(kind: QuotaKind, ip: string, now = new Date()): Promise<QuotaResult> {
  const db = supabaseAdmin();
  if (!db) return 'unavailable';
  try {
    const { data, error } = await db.rpc('claim_feedback_slot', {
      p_day: now.toISOString().slice(0, 10),
      p_kind: kind,
      p_ip_hash: hashIp(ip),
      p_ip_max: QUOTA_CAPS[kind].ip,
      p_global_max: QUOTA_CAPS[kind].global,
    });
    if (error) return 'unavailable';
    return data === 'ok' || data === 'ip_capped' || data === 'global_capped' ? data : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

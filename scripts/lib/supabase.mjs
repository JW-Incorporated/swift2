// Shared Supabase service-role client factory (R4, Fable 5.1 architecture
// review, PR #3709, task R4).
//
// WHY THIS EXISTS: every privileged-write script in this repo re-implemented
// the identical five lines — read SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY from
// env, `createClient(url, key, { auth: { persistSession: false,
// autoRefreshToken: false } })` — independently. That duplication is exactly
// the kind of thing that drifts (one caller quietly forgetting
// `persistSession: false`, another using the anon key by mistake) with no
// single place to fix it. This module is that single place.
//
// Deliberately narrow: this is the SERVICE-ROLE (privileged write) client
// only. Scripts that read with the anon key on purpose (the
// `sync-longlive-*.mjs` public-read pattern) are unaffected and keep doing
// that themselves — folding them in here would blur a real distinction, not
// remove duplication.
import { createClient } from '@supabase/supabase-js';

/**
 * A Supabase client authenticated with the service-role key, or `null` when
 * the required env vars are not set. Every caller already treats `null` as
 * "credentials missing — degrade" (skip a step, throw a clear error, etc.),
 * so this preserves that contract rather than throwing itself.
 */
export function serviceClient(env = process.env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

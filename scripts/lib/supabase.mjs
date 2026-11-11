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

const BARE_HOST = /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/.*)?$/i;

/**
 * A bare host (`<ref>.supabase.co`, no scheme) gets `https://`; anything with a scheme, and
 * anything that does not look like a host, is returned unchanged so supabase-js still throws
 * its own clear error.
 */
export function normalizeSupabaseUrl(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return BARE_HOST.test(trimmed) ? `https://${trimmed}` : value;
}

/** True when the normalized value parses as an http(s) URL. */
export function isValidSupabaseUrl(value) {
  try {
    const { protocol } = new URL(normalizeSupabaseUrl(value));
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * A Supabase client authenticated with the service-role key, or `null` when
 * the required env vars are not set. Every caller already treats `null` as
 * "credentials missing — degrade" (skip a step, throw a clear error, etc.),
 * so this preserves that contract rather than throwing itself.
 */
export function serviceClient(env = process.env) {
  const url = normalizeSupabaseUrl(env.SUPABASE_URL);
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const SUPABASE_URL_MESSAGE =
  'SUPABASE_URL must be the bare project URL like https://<ref>.supabase.co (no path, quotes or spaces)';

const PROJECT_URL = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/;
const LOCAL_URL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/;

/**
 * Strict check for the unattended home tasks. Trims surrounding whitespace and quotes, then
 * returns `{ ok: true, url }` (one trailing slash stripped) or `{ ok: false, rule }` where
 * `rule` names the failed rule only, never the value.
 */
export function checkBareSupabaseUrl(value) {
  if (typeof value !== 'string') return { ok: false, rule: 'missing' };
  const url = value.trim().replace(/^["']+|["']+$/g, '').trim();
  if (/\s/.test(url)) return { ok: false, rule: 'whitespace' };
  if (/["']/.test(url)) return { ok: false, rule: 'quoted' };
  if (PROJECT_URL.test(url) || LOCAL_URL.test(url)) return { ok: true, url: url.replace(/\/$/, '') };
  if (!/^https:\/\//.test(url) && !LOCAL_URL.test(url)) return { ok: false, rule: 'not https' };
  if (/^https:\/\/[^/]*\/./.test(url)) return { ok: false, rule: 'has a path' };
  return { ok: false, rule: 'not a bare <ref>.supabase.co host' };
}

/**
 * `serviceClient` that fails loudly on a malformed SUPABASE_URL. Still returns `null` when the
 * env vars are simply unset.
 */
export function strictServiceClient(env = process.env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const result = checkBareSupabaseUrl(env.SUPABASE_URL);
  if (!result.ok) throw new Error(`${SUPABASE_URL_MESSAGE} [failed rule: ${result.rule}]`);
  return serviceClient({ ...env, SUPABASE_URL: result.url });
}

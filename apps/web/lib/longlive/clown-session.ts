/**
 * Clownbot memory (PLAN.md Stage 11, proposal §7) — Supabase anonymous-auth
 * session resolution.
 *
 * `apps/web` deliberately has no `@supabase/supabase-js` dependency (see
 * `lib/current.ts`'s `loadLiveTheories`/`loadFanSignals` header comment) —
 * this module talks to Supabase Auth
 * (GoTrue) and PostgREST the same way, raw `fetch()` over each REST endpoint,
 * rather than adding the SDK for one feature.
 *
 * LIVE STATE (2026-08-23/24): "Allow anonymous sign-ins" is not yet toggled
 * on in the Supabase dashboard (HUMAN-ACTIONS.md #15 item 2, an agent can't
 * reach that toggle). `resolveClownSession` genuinely attempts the sign-in
 * every time it's called with no valid existing token — while the toggle is
 * off, Supabase Auth answers with an error and this resolves to `null`. That
 * `null` IS the feature flag: every caller in this stage (`clown-memory.ts`,
 * `clown-predictions.ts`, `clown-pins.ts`) treats a `null` session as
 * "degrade to today's no-persistence behavior," never a crash, never a
 * retry-storm (one warn log per warm instance, not per request).
 */

export interface ClownSessionToken {
  accessToken: string;
  refreshToken: string;
}

export interface ClownSession extends ClownSessionToken {
  userId: string;
}

interface MemoryEnv {
  supabaseUrl: string;
  supabaseKey: string;
}

/** Same env-detection shape as `clown-agent-tools.ts`'s `knowledgeEnv` /
 * `lib/current.ts`'s `supabaseEnv` — kept as its own small copy per that
 * module's own stated rationale, not a shared import. */
export function clownMemoryEnv(): MemoryEnv | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return { supabaseUrl, supabaseKey };
}

/** Every PostgREST call in this stage authenticates as the resolved
 * anonymous-auth user (their own access token), never the bare anon key —
 * that's what makes `auth.uid() = user_id` RLS scoping actually apply. */
export function clownAuthHeaders(env: MemoryEnv, session: ClownSession): Record<string, string> {
  return { apikey: env.supabaseKey, Authorization: `Bearer ${session.accessToken}` };
}

interface RawAuthResponse {
  access_token?: unknown;
  refresh_token?: unknown;
  user?: { id?: unknown };
}

function parseSession(raw: unknown): ClownSession | null {
  const r = (raw ?? {}) as RawAuthResponse;
  const accessToken = r.access_token;
  const refreshToken = r.refresh_token;
  const userId = r.user?.id;
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string' || typeof userId !== 'string') return null;
  return { userId, accessToken, refreshToken };
}

async function signInAnonymously(env: MemoryEnv, fetchImpl: typeof fetch, signal?: AbortSignal): Promise<ClownSession | null> {
  const res = await fetchImpl(`${env.supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: env.supabaseKey, 'content-type': 'application/json' },
    body: '{}',
    signal,
  });
  if (!res.ok) return null;
  return parseSession(await res.json());
}

async function refreshSession(
  env: MemoryEnv,
  refreshToken: string,
  fetchImpl: typeof fetch,
  signal?: AbortSignal,
): Promise<ClownSession | null> {
  const res = await fetchImpl(`${env.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: env.supabaseKey, 'content-type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
    signal,
  });
  if (!res.ok) return null;
  return parseSession(await res.json());
}

/** One warn per warm instance (same "best-effort per-instance" posture as
 * `clown-route-helpers.ts`'s rate limiter) — never a log line per request,
 * which would spam every single chat message while the toggle stays off. */
let warnedAuthUnavailable = false;

/** Test-only reset — mirrors no particular existing precedent, but is the
 * only way to exercise the "warns exactly once" behavior deterministically
 * across multiple `it()` blocks. */
export function resetClownSessionWarningForTests(): void {
  warnedAuthUnavailable = false;
}

/**
 * Resolves an authenticated anonymous-auth session: continues `existing` via
 * a refresh-token exchange when given one, else (or on a failed refresh)
 * mints a fresh anonymous session. Returns `null` — never throws — when
 * Supabase env isn't configured, the network call fails, or anonymous
 * sign-ins are disabled (today's real state; see header).
 *
 * `signal`, when given, bounds BOTH auth attempts — the route threads its
 * own single shared request deadline through here (same discipline as every
 * other call `route.ts` makes) so a slow/hung Auth endpoint can never add
 * unbounded latency to a chat reply; an abort is just another failure mode
 * this function already degrades gracefully from.
 */
export async function resolveClownSession(
  existing?: ClownSessionToken | null,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<ClownSession | null> {
  const env = clownMemoryEnv();
  if (!env) return null;
  try {
    if (existing) {
      const refreshed = await refreshSession(env, existing.refreshToken, fetchImpl, signal);
      if (refreshed) return refreshed;
    }
    const created = await signInAnonymously(env, fetchImpl, signal);
    if (created) return created;
  } catch {
    // falls through to the warn-once below
  }
  if (!warnedAuthUnavailable) {
    warnedAuthUnavailable = true;
    console.log(
      'clown:memory-auth-unavailable',
      JSON.stringify({ reason: 'anonymous sign-in unavailable — see HUMAN-ACTIONS.md #15 item 2' }),
    );
  }
  return null;
}

/** Opaque, base64-encoded round-trip token — carried in the `clown_session`
 * `HttpOnly` cookie (see `route.ts`) so a returning browser resends it
 * automatically without any client-side token handling at all (architect-
 * directed redesign, HUMAN-ACTIONS.md #15 round 4: this used to be a
 * client-visible `x-clown-session` header/localStorage value; a client-
 * visible Supabase credential pair was the actual finding). Encoding logic
 * itself is unchanged — only where it's read from/written to changed. */
export function encodeSessionToken(session: ClownSessionToken): string {
  return Buffer.from(JSON.stringify({ a: session.accessToken, r: session.refreshToken }), 'utf8').toString('base64');
}

export function decodeSessionToken(headerValue: string | null): ClownSessionToken | null {
  if (!headerValue) return null;
  try {
    const parsed = JSON.parse(Buffer.from(headerValue, 'base64').toString('utf8')) as { a?: unknown; r?: unknown };
    if (typeof parsed.a !== 'string' || typeof parsed.r !== 'string') return null;
    return { accessToken: parsed.a, refreshToken: parsed.r };
  } catch {
    return null;
  }
}

/** Cookie name for the session token — `HttpOnly`, so no client JS (this
 * app's own or a future XSS) can ever read the Supabase credential pair
 * directly; the browser's cookie jar handles persistence and same-origin
 * resend with zero client code. */
export const CLOWN_SESSION_COOKIE_NAME = 'clown_session';

/** 180 days — matches the retention policy already decided for
 * `clown_conversation`/`clown_turn` (docs/decisions.md 2026-08-23 item 6,
 * `20260904000000_clown_sessions.sql`'s `expires_at` default). */
const CLOWN_SESSION_COOKIE_MAX_AGE_S = 15_552_000;

/** Extracts the raw (still-encoded) session token from a request's `Cookie`
 * header — the same string `decodeSessionToken` already expects, just read
 * from a cookie instead of a bespoke request header. */
export function readSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === CLOWN_SESSION_COOKIE_NAME) return part.slice(eq + 1).trim();
  }
  return null;
}

/** The `Set-Cookie` response header value carrying the round-tripped session.
 * `HttpOnly` (no client JS access) + `Secure` (HTTPS only) + `SameSite=Strict`
 * (never sent cross-site) + `Path=/api/clown` (scoped to this route only) —
 * the browser handles persistence and resend automatically from here, no
 * client-side storage code needed. */
export function buildSessionCookieHeader(encodedToken: string): string {
  return `${CLOWN_SESSION_COOKIE_NAME}=${encodedToken}; HttpOnly; Secure; SameSite=Strict; Path=/api/clown; Max-Age=${CLOWN_SESSION_COOKIE_MAX_AGE_S}`;
}

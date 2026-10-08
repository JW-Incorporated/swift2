/**
 * DB-backed GLOBAL usage gate (Fable 5.1 architecture review, task R13).
 *
 * `mood-usage.ts` / `clown-usage.ts`'s `MoodUsage.reserve()` only ever
 * bounded spend PER WARM SERVERLESS INSTANCE — every warm instance gets its
 * own fresh `MOOD_DAILY_CAP`/`CLOWN_DAILY_CAP` allowance, so the real
 * cross-instance ceiling was `cap * (number of warm instances)`, not `cap`
 * (both files' own headers called this out as a known, accepted
 * limitation). This module is the fix: it reuses the exact `usage_daily`
 * table / RPC (`supabase/migrations/20260902000000_usage_daily.sql`,
 * `increment_usage_daily`) that `clown-memory.ts`'s `incrementUserUsage`
 * already backs the PER-USER cap with — one durable counter table, scoped
 * (never colliding, since the table's primary key is
 * `(scope, usage_date)`).
 *
 * SCOPE NAMESPACE: `extract` (worker), `gnews` (worker), `clown-chat:<uid>`
 * (per-user, `clown-memory.ts`), and now `mood-chat-global` /
 * `clown-chat-global` (this module, one shared row per feature per day —
 * not per user).
 *
 * CALLS WITH THE SERVICE ROLE KEY (like the worker's usage-store.ts, NOT a
 * per-user access token the way `incrementUserUsage` does) — there is no
 * authenticated end-user session on the classify/compose hot path, only an
 * anonymous website visitor. `auth.uid()` is null for a service-role call
 * (no `sub` claim), so the RPC's per-caller scope check
 * (`20260905000000_usage_daily_grants.sql`: "skipped entirely" when
 * `caller_uid is null") never fires for this scope — the same way it
 * already doesn't for the worker's `extract`/`gnews` scopes.
 *
 * FAILS OPEN, same posture every other `usage_daily` caller already takes
 * on a durable-counter miss (`incrementUserUsage`'s own header states this
 * explicitly): unconfigured env, an unreachable Supabase, a non-2xx
 * response, or a malformed body all return `true` (spend allowed) rather
 * than degrading the whole feature to keyword-fallback because of a DB
 * hiccup. The in-process `MoodUsage.reserve()` fast pre-check this backs
 * still bounds a single warm instance even when this call fails open.
 */

/** One RPC call: bumps `usage_daily(scope, today)` and reports whether the
 * post-increment count is still within `cap`. `true` (spend allowed) on
 * every degraded state — see the module header's FAILS OPEN note. */
export async function checkGlobalDailyCap(
  scope: string,
  cap: number,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return true;
  try {
    const res = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/increment_usage_daily`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ p_scope: scope }),
      signal,
    });
    if (!res.ok) return true;
    const count = await res.json();
    return typeof count === 'number' ? count <= cap : true;
  } catch {
    return true;
  }
}

/** The shape `reserveGlobalUsage` needs off a `MoodUsage`/`ClownUsage`
 * instance — a structural type (not an import of the class itself) so this
 * module has no compile-time dependency on either concrete usage class. */
export interface LocalUsageGate {
  reserve(): boolean;
  reservedDay(): string;
  release(day: string): void;
}

/**
 * THE combined gate every caller should reserve through: the in-process
 * counter first (a free, synchronous, per-instance floor — unchanged
 * behaviour, still refuses immediately once a single warm instance's own
 * cap is hit without ever reaching the network), then — only once that
 * passes — the durable cross-instance `usage_daily` row for `scope`. A
 * local reservation that the DB gate then denies is given back
 * (`release()`, day-keyed exactly like the existing per-user-cap giveback
 * in `clown-agent.ts`) rather than silently wasting a slot some other
 * request on this same instance could still have used today.
 */
export async function reserveGlobalUsage(
  usage: LocalUsageGate,
  scope: string,
  cap: number,
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<boolean> {
  if (!usage.reserve()) return false;
  const day = usage.reservedDay();
  const withinGlobalCap = await checkGlobalDailyCap(scope, cap, fetchImpl, signal);
  if (!withinGlobalCap) {
    usage.release(day);
    return false;
  }
  return true;
}
